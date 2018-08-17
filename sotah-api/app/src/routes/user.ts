import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";
import * as bcrypt from "bcrypt";

import { Messenger } from "../lib/messenger";
import { Models } from "../models";
import { withoutPassword, generateJwtToken } from "../models/user";
import { getRouter as getBaseRouter } from "./user/base";
import { getRouter as getPreferencesRouter } from "./user/preferences";
import { getRouter as getPricelistsCrudRouter } from "./user/pricelists-crud";
import { getRouter as getProfessionPricelistsCrudRouter } from "./user/profession-pricelists-crud";
import { UserRequestBodyRules } from "../lib/validator-rules";

type UserCreateBody = {
  email: string
  password: string
};

export const getRouter = (models: Models, messenger: Messenger) => {
  const router = Router();
  const { User } = models;

  router.use("/user/preferences", getPreferencesRouter(models));
  router.use("/user/pricelists", getPricelistsCrudRouter(models, messenger));
  router.use("/user/profession-pricelists", getProfessionPricelistsCrudRouter(models));
  router.use("/user", getBaseRouter(models));

  router.post("/users", wrap(async (req: Request, res: Response) => {
    let result: UserCreateBody | null = null;
    try {
      result = await UserRequestBodyRules.validate(req.body) as UserCreateBody;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json({ [err.path]: err.message });

      return;
    }

    if (await User.findOne({ where: { email: result.email } }) !== null) {
      res.status(HTTPStatus.BAD_REQUEST).json({ email: "Email is already in use!" });

      return;
    }

    const user = await User.create({
      email: result.email,
      hashed_password: await bcrypt.hash(result.password, 10)
    });

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
