import { wrap } from "async-middleware";
import * as boll from "bollinger-bands";
import { Request, Response, Router } from "express";
import * as HttpStatus from "http-status";

import {
    IAuctionsQueryItem,
    IAuctionsQueryRequestBody,
    IAuctionsRequestBody,
    IItemsRequestBody,
    IOwnersQueryByItemsRequestBody,
    IOwnersRequestBody,
    ItemId,
} from "../lib/auction";
import { code, Message, Messenger } from "../lib/messenger";
import {
    PricelistHistoryMap,
    PricelistHistoryRequest,
    PriceListRequestBody,
    Prices,
    UnmetDemandRequestBody,
} from "../lib/price-list";
import { IRealm } from "../lib/realm";
import { IModels } from "../models";
import { IPricelistEntryInstance } from "../models/pricelist-entry";
import { IProfessionPricelistInstance } from "../models/profession-pricelist";

interface IStatusRealm extends IRealm {
    regionName: string;
}

interface IStatusResponse {
    realms: IStatusRealm[];
}

interface IPriceLimits {
    upper: number;
    lower: number;
}

interface IItemPriceLimits {
    [itemId: number]: IPriceLimits;
}

interface IItemMarketPrices {
    [itemId: number]: number;
}

interface IBollingerBands {
    upper: number[];
    mid: number[];
    lower: number[];
}

export const handleMessage = <T>(res: Response, msg: Message<T>) => {
    switch (msg.code) {
        case code.ok:
            res.send(msg.data).end();

            return;
        case code.notFound:
            res.status(HttpStatus.NOT_FOUND)
                .send(msg.error!.message)
                .end();

            return;
        case code.userError:
            res.status(HttpStatus.BAD_REQUEST)
                .send(msg.error!.message)
                .end();

            return;
        default:
            res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send(msg.error!.message)
                .end();

            return;
    }
};

export const getRouter = (models: IModels, messenger: Messenger) => {
    const router = Router();
    const { Pricelist, PricelistEntry, ProfessionPricelist } = models;

    router.get(
        "/regions",
        wrap(async (_, res) => {
            const msg = await messenger.getRegions();
            res.send(msg.data).end();
        }),
    );
    router.get(
        "/item-classes",
        wrap(async (_, res) => {
            const msg = await messenger.getItemClasses();
            res.send(msg.data).end();
        }),
    );
    router.get(
        "/boot",
        wrap(async (_, res) => {
            const msg = await messenger.getBoot();
            res.send(msg.data).end();
        }),
    );
    router.get(
        "/region/:regionName/realms",
        wrap(async (req, res) => {
            const msg = await messenger.getStatus(req.params["regionName"]);
            if (msg.code === code.notFound) {
                res.status(HttpStatus.NOT_FOUND).end();

                return;
            }

            const response: IStatusResponse = {
                realms: msg.data!.realms.map(realm => {
                    return { ...realm, regionName: req.params["regionName"] };
                }),
            };

            res.send(response).end();
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/auctions",
        wrap(async (req, res) => {
            const {
                count,
                page,
                sortDirection,
                sortKind,
                ownerFilters,
                itemFilters,
            } = req.body as IAuctionsRequestBody;
            const msg = await messenger.getAuctions({
                count,
                item_filters: itemFilters,
                owner_filters: ownerFilters,
                page,
                realm_slug: req.params["realmSlug"],
                region_name: req.params["regionName"],
                sort_direction: sortDirection,
                sort_kind: sortKind,
            });
            switch (msg.code) {
                case code.ok:
                    const itemIds = msg.data!.auctions.map(v => v.itemId);
                    const itemsMsg = await messenger.getItems(itemIds);
                    if (itemsMsg.code !== code.ok) {
                        res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .send(msg.error!.message)
                            .end();

                        return;
                    }

                    res.send({ ...msg.data!, items: itemsMsg.data!.items }).end();

                    return;
                case code.notFound:
                    res.status(HttpStatus.NOT_FOUND)
                        .send(msg.error!.message)
                        .end();

                    return;
                case code.userError:
                    res.status(HttpStatus.BAD_REQUEST)
                        .send(msg.error!.message)
                        .end();

                    return;
                default:
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .send(msg.error!.message)
                        .end();

                    return;
            }
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/owners",
        wrap(async (req, res) => {
            const { query } = req.body as IOwnersRequestBody;
            const msg = await messenger.getOwners({
                query,
                realm_slug: req.params["realmSlug"],
                region_name: req.params["regionName"],
            });
            handleMessage(res, msg);
        }),
    );
    router.post(
        "/items",
        wrap(async (req, res) => {
            const { query } = req.body as IItemsRequestBody;
            const msg = await messenger.queryItems(query);
            handleMessage(res, msg);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/query-auctions",
        wrap(async (req, res) => {
            const { query } = req.body as IAuctionsQueryRequestBody;

            const itemsMessage = await messenger.queryItems(query);
            if (itemsMessage.code !== code.ok) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: itemsMessage.error });

                return;
            }

            const ownersMessage = await messenger.queryOwners({
                query,
                realm_slug: req.params["realmSlug"],
                region_name: req.params["regionName"],
            });
            if (ownersMessage.code !== code.ok) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: ownersMessage.error });

                return;
            }

            let items: IAuctionsQueryItem[] = [
                ...itemsMessage.data!.items.map(v => {
                    const result: IAuctionsQueryItem = { ...v, owner: null };

                    return result;
                }),
                ...ownersMessage.data!.items.map(v => {
                    const result: IAuctionsQueryItem = { ...v, item: null };

                    return result;
                }),
            ];
            items = items.sort((a, b) => {
                if (a.rank !== b.rank) {
                    return a.rank > b.rank ? 1 : -1;
                }

                if (a.target !== b.target) {
                    return a.target > b.target ? 1 : -1;
                }

                return 0;
            });
            items = items.slice(0, 10);

            res.json({ items });
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/query-owner-items",
        wrap(async (req, res) => {
            const { items } = req.body as IOwnersQueryByItemsRequestBody;
            const msg = await messenger.queryOwnerItems({
                items,
                realm_slug: req.params["realmSlug"],
                region_name: req.params["regionName"],
            });
            handleMessage(res, msg);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/price-list",
        wrap(async (req, res) => {
            const { item_ids } = req.body as PriceListRequestBody;
            const price_list = (await messenger.getPriceList({
                item_ids,
                realm_slug: req.params["realmSlug"],
                region_name: req.params["regionName"],
            })).data!.price_list;
            const items = (await messenger.getItems(item_ids)).data!.items;

            res.json({ price_list, items });
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/price-list-history",
        wrap(async (req, res) => {
            const { item_ids } = req.body as PricelistHistoryRequest;
            const currentUnixTimestamp = Math.floor(Date.now() / 1000);
            const lowerBounds = currentUnixTimestamp - 60 * 60 * 24 * 14;
            const history = (await messenger.getPricelistHistories({
                item_ids,
                lower_bounds: lowerBounds,
                realm_slug: req.params["realmSlug"],
                region_name: req.params["regionName"],
                upper_bounds: currentUnixTimestamp,
            })).data!.history;
            const items = (await messenger.getItems(item_ids)).data!.items;

            const itemMarketPrices: IItemMarketPrices = [];

            const itemPriceLimits: IItemPriceLimits = item_ids.reduce((previousItemPriceLimits, itemId) => {
                const out: IPriceLimits = {
                    lower: 0,
                    upper: 0,
                };

                if (!(itemId in history)) {
                    return {
                        ...previousItemPriceLimits,
                        [itemId]: out,
                    };
                }

                const itemPriceHistory: PricelistHistoryMap = history[itemId];
                const itemPrices: Prices[] = Object.keys(itemPriceHistory).map(v => itemPriceHistory[v]);
                if (itemPrices.length > 0) {
                    const bands: IBollingerBands = boll(
                        itemPrices.map(v => v.min_buyout_per),
                        itemPrices.length > 4 ? 4 : itemPrices.length,
                    );
                    const minBandMid = bands.mid.filter(v => !!v).reduce((previousValue, v) => {
                        if (v === 0) {
                            return previousValue;
                        }

                        if (previousValue === 0) {
                            return v;
                        }

                        if (v < previousValue) {
                            return v;
                        }

                        return previousValue;
                    }, 0);
                    const maxBandUpper = bands.upper.filter(v => !!v).reduce((previousValue, v) => {
                        if (v === 0) {
                            return previousValue;
                        }

                        if (previousValue === 0) {
                            return v;
                        }

                        if (v > previousValue) {
                            return v;
                        }

                        return previousValue;
                    }, 0);
                    out.lower = minBandMid;
                    out.upper = maxBandUpper;
                }

                return {
                    ...previousItemPriceLimits,
                    [itemId]: out,
                };
            }, {});

            const overallPriceLimits: IPriceLimits = { lower: 0, upper: 0 };
            overallPriceLimits.lower = item_ids.reduce((overallLower, itemId) => {
                if (itemPriceLimits[itemId].lower === 0) {
                    return overallLower;
                }
                if (overallLower === 0) {
                    return itemPriceLimits[itemId].lower;
                }

                if (itemPriceLimits[itemId].lower < overallLower) {
                    return itemPriceLimits[itemId].lower;
                }

                return overallLower;
            }, 0);
            overallPriceLimits.upper = item_ids.reduce((overallUpper, itemId) => {
                if (overallUpper > itemPriceLimits[itemId].upper) {
                    return overallUpper;
                }

                return itemPriceLimits[itemId].upper;
            }, 0);

            res.json({ history, items, itemPriceLimits, overallPriceLimits, itemMarketPrices });
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/unmet-demand",
        wrap(async (req, res) => {
            // gathering profession-pricelists
            const { expansion } = req.body as UnmetDemandRequestBody;
            const professionPricelists = await ProfessionPricelist.findAll({
                include: [
                    {
                        include: [{ model: PricelistEntry, required: true }],
                        model: Pricelist,
                        required: true,
                    },
                ],
                where: { expansion },
            });

            // gathering included item-ids
            const itemIds = professionPricelists.reduce((previousValue: ItemId[], v: IProfessionPricelistInstance) => {
                const pricelistEntries: IPricelistEntryInstance[] = v.get("pricelist").get("pricelist_entries");
                const pricelistItemIds: ItemId[] = pricelistEntries.map(entry => entry.get("item_id"));
                for (const itemId of pricelistItemIds) {
                    if (previousValue.indexOf(itemId) === -1) {
                        previousValue.push(itemId);
                    }
                }

                return previousValue;
            }, []);

            // gathering items
            const itemsMsg = await messenger.getItems(itemIds);
            if (itemsMsg.code !== code.ok) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: itemsMsg.error });

                return;
            }
            const items = itemsMsg.data!.items;

            // gathering pricing data
            const msg = await messenger.getPriceList({
                item_ids: itemIds,
                realm_slug: req.params["realmSlug"],
                region_name: req.params["regionName"],
            });
            if (msg.code !== code.ok) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: msg.error });

                return;
            }
            const msgData = msg.data!;

            // gathering unmet items
            const unmetItemIds = itemIds.filter(v => !(v.toString() in msgData.price_list));

            // filtering in unmet profession-pricelists
            const unmetProfessionPricelists = professionPricelists.filter(v => {
                const pricelistEntries: IPricelistEntryInstance[] = v.get("pricelist").get("pricelist_entries");
                const pricelistItemIds: ItemId[] = pricelistEntries.map(entry => entry.get("item_id"));
                const unmetPricelistItemIds = pricelistItemIds.filter(itemId => unmetItemIds.indexOf(itemId) > -1);

                return unmetPricelistItemIds.length > 0;
            });

            res.json({
                items,
                professionPricelists: unmetProfessionPricelists,
                unmetItemIds,
            });
        }),
    );
    router.get(
        "/profession-pricelists/:profession_name",
        wrap(async (req: Request, res: Response) => {
            // gathering pricelists associated with this user, region, and realm
            const professionPricelists = await ProfessionPricelist.findAll({
                include: [
                    {
                        include: [{ model: PricelistEntry, required: true }],
                        model: Pricelist,
                        required: true,
                    },
                ],
                where: { name: req.params["profession_name"] },
            });

            // gathering related items
            const itemIds: ItemId[] = professionPricelists.reduce((pricelistItemIds: ItemId[], professionPricelist) => {
                return professionPricelist
                    .get("pricelist")
                    .get("pricelist_entries")
                    .reduce((entryItemIds: ItemId[], entry: IPricelistEntryInstance) => {
                        const entryJson = entry.toJSON();
                        if (entryItemIds.indexOf(entryJson.item_id) === -1) {
                            entryItemIds.push(entryJson.item_id);
                        }

                        return entryItemIds;
                    }, pricelistItemIds);
            }, []);
            const items = (await messenger.getItems(itemIds)).data!.items;

            // dumping out a response
            res.json({ profession_pricelists: professionPricelists.map(v => v.toJSON()), items });
        }),
    );

    return router;
};
