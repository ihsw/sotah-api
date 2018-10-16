import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Preference, User } from "../../entities";
import { realmSlug } from "../../lib/realm";
import { regionName } from "../../lib/region";
import { auth } from "../../lib/session";
import { PreferenceRules } from "../../lib/validator-rules";

interface IPreferenceRequestBody {
    id?: number;
    user_id: number;
    current_region: regionName | null;
    current_realm: realmSlug | null;
}

export const getRouter = (dbConn: Connection) => {
    const router = Router();

    router.get(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as User;
            const preference = await dbConn.getRepository(Preference).findOne({ where: { user_id: user.id } });

            if (typeof preference === "undefined") {
                res.status(HTTPStatus.NOT_FOUND).send();

                return;
            }

            res.json({ preference });
        }),
    );

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as User;
            let preference = await dbConn.getRepository(Preference).findOne({ where: { user_id: user.id } });

            if (typeof preference !== "undefined") {
                res.status(HTTPStatus.BAD_REQUEST).json({ error: "User already has preferences." });

                return;
            }

            let result: IPreferenceRequestBody | null = null;
            try {
                result = (await PreferenceRules.validate(req.body)) as IPreferenceRequestBody;
            } catch (err) {
                res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

                return;
            }

            preference = new Preference();
            preference.user = user;
            preference.currentRealm = result.current_realm;
            preference.currentRegion = result.current_region;
            await dbConn.manager.save(preference);
            res.status(HTTPStatus.CREATED).json({ preference });
        }),
    );

    router.put(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as User;
            const preference = await dbConn.getRepository(Preference).findOne({ where: { user_id: user.id } });

            if (typeof preference === "undefined") {
                res.status(HTTPStatus.NOT_FOUND).send();

                return;
            }

            let result: IPreferenceRequestBody | null = null;
            try {
                result = (await PreferenceRules.validate(req.body)) as IPreferenceRequestBody;
            } catch (err) {
                res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

                return;
            }

            preference.currentRealm = result.current_realm;
            preference.currentRegion = result.current_region;
            await dbConn.manager.save(preference);
            res.json({ preference });
        }),
    );

    return router;
};
