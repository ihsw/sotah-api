import * as bcrypt from "bcrypt";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { User } from "../entities/user";
import { Messenger } from "../lib/messenger";
import { UserRequestBodyRules } from "../lib/validator-rules";
import { IValidationErrorResponse } from "../types/contracts";
import { ICreateUserRequest, ICreateUserResponse, ILoginRequest, ILoginResponse } from "../types/contracts/user";
import { UserLevel } from "../types/entities";
import { RequestHandler } from "./index";

export class UserController {
    private messenger: Messenger;
    private dbConn: Connection;

    constructor(messenger: Messenger, dbConn: Connection) {
        this.messenger = messenger;
        this.dbConn = dbConn;
    }

    public createUser: RequestHandler<
        ICreateUserRequest,
        ICreateUserResponse | IValidationErrorResponse
    > = async req => {
        let result: ICreateUserRequest | null = null;
        try {
            result = (await UserRequestBodyRules.validate(req.body)) as ICreateUserRequest;
        } catch (err) {
            const validationErrorResponse: IValidationErrorResponse = { [err.path]: err.message };
            return {
                data: validationErrorResponse,
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        const existingUser = await this.dbConn.getRepository(User).findOne({ where: { email: result.email } });
        if (typeof existingUser !== "undefined") {
            const userValidationError: IValidationErrorResponse = { email: "Email is already in use!" };
            return {
                data: userValidationError,
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        const user = new User();
        user.email = result.email;
        user.hashedPassword = await bcrypt.hash(result.password, 10);
        user.level = UserLevel.Regular;
        await this.dbConn.manager.save(user);

        return {
            data: {
                token: await user.generateJwtToken(this.messenger),
                user: user.toJson(),
            },
            status: HTTPStatus.CREATED,
        };
    };

    public login: RequestHandler<ILoginRequest, ILoginResponse | IValidationErrorResponse> = async req => {
        // validating provided email
        const email: string = req.body.email;
        const user = await this.dbConn.getRepository(User).findOne({ where: { email } });
        if (typeof user === "undefined") {
            const userValidationError = { email: "Invalid email!" };

            return {
                data: userValidationError,
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        // validating provided password
        const password: string = req.body.password;
        const isMatching = await bcrypt.compare(password, user.hashedPassword);
        if (isMatching === false) {
            const passwordValidationError = { password: "Invalid password!" };

            return {
                data: passwordValidationError,
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        // issuing a jwt token
        return {
            data: { token: await user.generateJwtToken(this.messenger) },
            status: HTTPStatus.OK,
        };
    };
}
