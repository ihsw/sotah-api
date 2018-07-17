import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";
import * as bcrypt from "bcrypt";

import { Models } from "../models";
import { withoutPassword, generateJwtToken } from "../models/user";
import { getRouter as getCrudRouter } from "./user/crud";
import { getRouter as getPreferencesRouter } from "./user/preferences";
import { getRouter as getPricelistsCrudRouter } from "./user/pricelists-crud";

export const getRouter = (models: Models) => {
  const router = Router();
  const { User } = models;

  router.use("/user/preferences", getPreferencesRouter(models));
  router.use("/user/pricelists", getPricelistsCrudRouter(models));
  router.use("/user", getCrudRouter(models));

  router.post("/users", wrap(async (req: Request, res: Response) => {
    const email: string = req.body.email;
    const password: string = await bcrypt.hash(req.body.password, 10);

    let user = await User.findOne({ where: { email } });
    if (user !== null) {
      res.status(HTTPStatus.BAD_REQUEST).json({ email: "Email is already in use!" });

      return;
    }

    user = await User.create({ email, hashed_password: password });

    res.status(HTTPStatus.CREATED).json({
      token: generateJwtToken(user),
      user: withoutPassword(user)
    });
  }));

  router.post("/login", wrap(async (req: Request, res: Response) => {
    // validating provided email
    const email: string = req.body.email;
    const user = await User.findOne({ where: { email } });
    if (user === null) {
      res.status(HTTPStatus.BAD_REQUEST).json({ email: "Invalid email!" });

      return;
    }

    // validating provided password
    const password: string = req.body.password;
    const isMatching = await bcrypt.compare(password, user.get("hashed_password"));
    if (isMatching === false) {
      res.status(HTTPStatus.BAD_REQUEST).json({ password: "Invalid password!" });

      return;
    }

    // issuing a jwt token
    res.status(HTTPStatus.OK).json({
      token: generateJwtToken(user),
      user: withoutPassword(user)
    });
  }));

  return router;
};
