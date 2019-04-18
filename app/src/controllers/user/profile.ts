import { Response } from "express";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { UserRepository } from "../../entities/user-repository";
import { UpdateProfileRequestBodyRules } from "../../lib/validator-rules";
import { IValidationErrorResponse } from "../../types/contracts";
import { IUpdateProfileRequest, IUpdateProfileResponse } from "../../types/contracts/user/profile";
import { UserLevel } from "../../types/entities";
import { Authenticator, IRequest, IRequestResult, ManualValidator } from "../index";

export class ProfileController {
    private dbConn: Connection;

    constructor(dbConn: Connection) {
        this.dbConn = dbConn;
    }

    @Authenticator<IUpdateProfileRequest, IUpdateProfileResponse>(UserLevel.Regular)
    public async updateProfile(
        req: IRequest<IUpdateProfileRequest>,
        _res: Response,
    ): Promise<IRequestResult<IUpdateProfileResponse | IValidationErrorResponse>> {
        const result = await ManualValidator<IUpdateProfileRequest>(
            req,
            UpdateProfileRequestBodyRules(this.dbConn.getCustomRepository(UserRepository)),
        );
        if (typeof result.errorResult !== "undefined") {
            return result.errorResult;
        }
        const { body } = result.req!;

        const user = req.user!;
        user.email = body.email;

        await this.dbConn.manager.save(user);

        return {
            data: { email: user.email },
            status: HTTPStatus.OK,
        };
    }
}
