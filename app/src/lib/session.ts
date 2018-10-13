import { Express, NextFunction, Request, Response } from "express";
import * as passport from "passport";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";

import { UserModel } from "../models/user";
import { code, Messenger } from "./messenger";

export interface ISessionSecretResponse {
    session_secret: string;
}

export interface IJwtOptions {
    audience: string;
    issuer: string;
    secret: string;
}

export const getJwtOptions = async (messenger: Messenger): Promise<IJwtOptions> => {
    const msg = await messenger.getSessionSecret();
    if (msg.code !== code.ok) {
        throw new Error(msg.error!.message);
    }

    return {
        audience: "sotah-client",
        issuer: "sotah-api",
        secret: msg.data!.session_secret,
    };
};

export interface IJwtPayload {
    data: string;
}

export const appendSessions = async (app: Express, messenger: Messenger, User: UserModel): Promise<Express> => {
    const jwtOptions = await getJwtOptions(messenger);

    const opts: StrategyOptions = {
        audience: jwtOptions.audience,
        issuer: jwtOptions.issuer,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: jwtOptions.secret,
    };
    passport.use(
        new Strategy(opts, (jwtPayload: IJwtPayload, done) => {
            (async () => {
                const user = await User.findById(jwtPayload.data);
                if (user === null) {
                    done(null, false);
                }

                done(null, user);
            })();
        }),
    );

    app.use(passport.initialize());

    return app;
};

export const auth = (req: Request, res: Response, next: NextFunction) => {
    return passport.authenticate("jwt", { session: false })(req, res, next);
};
