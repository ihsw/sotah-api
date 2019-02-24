import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import { Connection } from "typeorm";

import { DataController, handle } from "../controllers";
import { Messenger } from "../lib/messenger";
import { auth } from "../lib/session";

export const getRouter = (dbConn: Connection, messenger: Messenger) => {
    const router = Router();
    const controller = new DataController(messenger, dbConn);

    router.get(
        "/posts",
        wrap(async (req: Request, res: Response) => {
            await handle(controller.getPosts, req, res);
        }),
    );
    router.get(
        "/posts/:post_slug",
        wrap(async (req: Request, res: Response) => {
            await handle(controller.getPost, req, res);
        }),
    );
    router.get(
        "/boot",
        wrap(async (req, res) => {
            await handle(controller.getBoot, req, res);
        }),
    );
    router.get(
        "/region/:regionName/realms",
        wrap(async (req, res) => {
            await handle(controller.getRealms, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/auctions",
        wrap(async (req, res) => {
            await handle(controller.getAuctions, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/owners",
        wrap(async (req, res) => {
            await handle(controller.getOwners, req, res);
        }),
    );
    router.post(
        "/items",
        wrap(async (req, res) => {
            await handle(controller.queryItems, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/query-auctions",
        wrap(async (req, res) => {
            await handle(controller.queryAuctions, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/query-owner-items",
        wrap(async (req, res) => {
            await handle(controller.queryOwnerItems, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/price-list",
        wrap(async (req, res) => {
            await handle(controller.getPricelist, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/price-list-history",
        auth,
        wrap(async (req, res) => {
            await handle(controller.getPricelistHistories, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/unmet-demand",
        wrap(async (req, res) => {
            await handle(controller.getUnmetDemand, req, res);
        }),
    );
    router.get(
        "/profession-pricelists/:profession_name",
        wrap(async (req: Request, res: Response) => {
            await handle(controller.getProfessionPricelists, req, res);
        }),
    );

    return router;
};
