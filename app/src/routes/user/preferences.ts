import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";

import { IModels } from "../../models";
import { IUserInstance } from "../../models/user";
import { IPreferenceAttributes } from "../../models/preference";
import { auth } from "../../lib/session";
import { PreferenceRules } from "../../lib/validator-rules";

export const getRouter = (models: IModels) => {
  const router = Router();
  const { Preference } = models;

  router.get("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as IUserInstance;
    const preference = await Preference.findOne({ where: { user_id: user.id } });

    if (preference === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    res.json({ preference: preference.toJSON() });
  }));

  router.post("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as IUserInstance;
    let preference = await Preference.findOne({ where: { user_id: user.id } });

    if (preference !== null) {
      res.status(HTTPStatus.BAD_REQUEST).json({ error: "User already has preferences." });

      return;
    }

    let result: IPreferenceAttributes | null = null;
    try {
      result = await PreferenceRules.validate(req.body) as IPreferenceAttributes;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

      return;
    }

    preference = await Preference.create({ ...result!, user_id: user.id });
    res.status(HTTPStatus.CREATED).json({ preference: preference.toJSON() });
  }));

  router.put("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as IUserInstance;
    const preference = await Preference.findOne({ where: { user_id: user.id } });

    if (preference === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    let result: IPreferenceAttributes | null = null;
    try {
      result = await PreferenceRules.validate(req.body) as IPreferenceAttributes;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

      return;
    }

    preference.setAttributes({ ...result });
    preference.save();
    res.json({ preference: preference.toJSON() });
  }));

  return router;
};
