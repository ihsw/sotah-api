import express = require("express");
import { Response } from "express";

export const router = express.Router();

router.get("/", (_, res: Response) => {
  res.set("Content-type", "text/plain").send("Hello, world!");
});
router.get("/ping", (_, res: Response) => {
  res.set("Content-type", "text/plain").send("Pong");
});
router.get("/internal-error", () => {
  throw new Error("Test error!");
});
