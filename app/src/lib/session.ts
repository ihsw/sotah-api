import { Express, Request, Response, NextFunction } from "express";
import * as passport from "passport";
import { Strategy, StrategyOptions, ExtractJwt } from "passport-jwt";
import { v4 as uuidv4 } from "uuid";

import { UserModel } from "../models/user";

export const jwtOptions = {
  audience: "sotah-api",
  issuer: "sotah-api",
  secret: uuidv4()
};

export type JwtPayload = {
  data: string
};

export const appendSessions = (app: Express, User: UserModel): Express => {
  const opts: StrategyOptions = {
    audience: jwtOptions.audience,
    issuer: jwtOptions.issuer,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtOptions.secret
  };
  passport.use(new Strategy(opts, (jwtPayload: JwtPayload, done) => {
    (async () => {
      const user = await User.findById(jwtPayload.data);
      if (user === null) {
        done(null, false);
      }

      done(null, user);
    })();
  }));

  app.use(passport.initialize());

  return app;
};

export const auth = (req: Request, res: Response, next: NextFunction) => {
  return passport.authenticate("jwt", { session: false })(req, res, next);
};
