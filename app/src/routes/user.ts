import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";
import * as bcrypt from "bcrypt";

import { Models } from "../models";
import { withoutPassword, UserInstance, generateJwtToken } from "../models/user";
import { PreferenceAttributes } from "../models/preference";
import { auth } from "../lib/session";
import { PreferenceRules } from "../lib/validator-rules";

export const getRouter = (models: Models) => {
  const router = Router();
  const { User, Preference } = models;

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

  router.get("/user/preferences", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    const preference = await Preference.findOne({ where: { user_id: user.id } });

    if (preference === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    res.json({ preference: preference.toJSON() });
  }));

  router.post("/user/preferences", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    let preference = await Preference.findOne({ where: { user_id: user.id } });

    if (preference !== null) {
      res.status(HTTPStatus.BAD_REQUEST).json({ error: "User already has preferences." });

      return;
    }

    let result: PreferenceAttributes | null = null;
    try {
      result = await PreferenceRules.validate(req.body) as PreferenceAttributes;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

      return;
    }

    preference = await Preference.create({ ...result!, user_id: user.id });
    res.status(HTTPStatus.CREATED).json(preference.toJSON());
  }));

  router.put("/user/preferences", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    const preference = await Preference.findOne({ where: { user_id: user.id } });

    if (preference === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    const allowed = Object.keys(preference.toJSON());
    const raw = req.body;
    const filtered = Object.keys(raw)
      .filter((key) => allowed.includes(key))
      .reduce((result, key) => {
        result[key] = raw[key];
        return result;
      }, {});
    preference.setAttributes(filtered);
    preference.save();
    res.json(preference.toJSON());

    res.json({ preference: preference.toJSON() });
  }));

  router.get("/user/:id", wrap(async (req: Request, res: Response) => {
    const user = await User.findById(req.params["id"]);
    if (user === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    res.json(withoutPassword(user));
  }));

  router.delete("/user/:id", wrap(async (req: Request, res: Response) => {
    const user = await User.findById(req.params["id"]);
    if (user === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    await User.destroy({ where: { id: user.id } });
    res.json({});
  }));

  router.put("/user/:id", wrap(async (req: Request, res: Response) => {
    const user = await User.findById(req.params["id"]);
    if (user === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    user.set("email", req.body.email);
    user.save();
    res.json(withoutPassword(user));
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

  router.get("/user", auth, wrap(async (req: Request, res: Response) => {
    res.json(withoutPassword(req.user as UserInstance));
  }));

  return router;
};
