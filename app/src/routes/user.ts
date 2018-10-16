import { wrap } from "async-middleware";
import * as bcrypt from "bcrypt";
import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { User } from "../entities";
import { UserLevel } from "../entities/user";
import { Messenger } from "../lib/messenger";
import { UserRequestBodyRules } from "../lib/validator-rules";
import { getRouter as getBaseRouter } from "./user/base";
import { getRouter as getPreferencesRouter } from "./user/preferences";
import { getRouter as getPricelistsCrudRouter } from "./user/pricelists-crud";
import { getRouter as getProfessionPricelistsCrudRouter } from "./user/profession-pricelists-crud";

interface IUserCreateBody {
    email: string;
    password: string;
}

export const getRouter = (dbConn: Connection, messenger: Messenger) => {
    const router = Router();

    router.use("/user/preferences", getPreferencesRouter(dbConn));
    router.use("/user/pricelists", getPricelistsCrudRouter(models, messenger));
    router.use("/user/profession-pricelists", getProfessionPricelistsCrudRouter(models));
    router.use("/user", getBaseRouter(models));

    router.post(
        "/users",
        wrap(async (req: Request, res: Response) => {
            let result: IUserCreateBody | null = null;
            try {
                result = (await UserRequestBodyRules.validate(req.body)) as IUserCreateBody;
            } catch (err) {
                res.status(HTTPStatus.BAD_REQUEST).json({ [err.path]: err.message });

                return;
            }

            const existingUser = await dbConn.getRepository(User).findOne({ where: { email: result.email } });
            if (typeof existingUser !== "undefined") {
                res.status(HTTPStatus.BAD_REQUEST).json({ email: "Email is already in use!" });

                return;
            }

            const user = new User();
            user.email = result.email;
            user.hashedPassword = await bcrypt.hash(result.password, 10);
            user.level = UserLevel.Regular;
            await dbConn.manager.save(user);

            res.status(HTTPStatus.CREATED).json({
                token: await user.generateJwtToken(messenger),
            });
        }),
    );

    router.post(
        "/login",
        wrap(async (req: Request, res: Response) => {
            // validating provided email
            const email: string = req.body.email;
            const user = await dbConn.getRepository(User).findOne({ where: { email } });
            if (typeof user === "undefined") {
                res.status(HTTPStatus.BAD_REQUEST).json({ email: "Invalid email!" });

                return;
            }

            // validating provided password
            const password: string = req.body.password;
            const isMatching = await bcrypt.compare(password, user.hashedPassword);
            if (isMatching === false) {
                res.status(HTTPStatus.BAD_REQUEST).json({ password: "Invalid password!" });

                return;
            }

            // issuing a jwt token
            res.status(HTTPStatus.OK).json({
                token: await user.generateJwtToken(messenger),
            });
        }),
    );

    return router;
};
