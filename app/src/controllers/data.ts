import * as boll from "bollinger-bands";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Post } from "../entities/post";
import { ProfessionPricelist } from "../entities/profession-pricelist";
import { code, Messenger } from "../lib/messenger";
import { AuctionsQueryParamsRules } from "../lib/validator-rules";
import { IErrorResponse, IValidationErrorResponse } from "../types/contracts";
import {
    IGetAuctionsRequest,
    IGetAuctionsResponse,
    IGetBootResponse,
    IGetOwnersRequest,
    IGetOwnersResponse,
    IGetPostResponse,
    IGetPostsResponse,
    IGetPricelistHistoriesRequest,
    IGetPricelistHistoriesResponse,
    IGetPricelistRequest,
    IGetPricelistResponse,
    IGetProfessionPricelistsResponse,
    IGetRealmsResponse,
    IGetUnmetDemandRequest,
    IGetUnmetDemandResponse,
    IQueryAuctionsItem,
    IQueryAuctionsRequest,
    IQueryAuctionsResponse,
    IQueryItemsRequest,
    IQueryItemsResponse,
    IQueryOwnerItemsRequest,
    IQueryOwnerItemsResponse,
} from "../types/contracts/data";
import { ItemId } from "../types/item";
import {
    IBollingerBands,
    IItemPriceLimits,
    IItemPricelistHistoryMap,
    IPriceLimits,
    IPricelistHistoryMap,
    IPrices,
} from "../types/pricelist";
import { QueryRequestHandler, RequestHandler } from "./index";

export class DataController {
    private messenger: Messenger;
    private dbConn: Connection;

    constructor(messenger: Messenger, dbConn: Connection) {
        this.messenger = messenger;
        this.dbConn = dbConn;
    }

    public getPost: RequestHandler<null, IGetPostResponse | IValidationErrorResponse> = async req => {
        const post = await this.dbConn.getRepository(Post).findOne({
            where: {
                slug: req.params["post_slug"],
            },
        });
        if (typeof post === "undefined" || post === null) {
            const validationResponse: IValidationErrorResponse = {
                notFound: "Not Found",
            };

            return {
                data: validationResponse,
                status: HTTPStatus.NOT_FOUND,
            };
        }

        return {
            data: { post: post.toJson() },
            status: HTTPStatus.OK,
        };
    };

    public getPosts: RequestHandler<null, IGetPostsResponse> = async () => {
        const posts = await this.dbConn.getRepository(Post).find({ order: { id: "DESC" }, take: 3 });

        return {
            data: { posts: posts.map(v => v.toJson()) },
            status: HTTPStatus.OK,
        };
    };

    public getBoot: RequestHandler<null, IGetBootResponse> = async () => {
        const msg = await this.messenger.getBoot();
        return { data: msg.data!, status: HTTPStatus.OK };
    };

    public getRealms: RequestHandler<null, IGetRealmsResponse | null> = async req => {
        const msg = await this.messenger.getStatus(req.params["regionName"]);
        if (msg.code === code.notFound) {
            return { status: HTTPStatus.NOT_FOUND, data: null };
        }

        const realms = msg
            .data!.realms.map(realm => {
                return { ...realm, regionName: req.params["regionName"] };
            })
            .sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                }

                if (a.name > b.name) {
                    return 1;
                }

                return 0;
            });

        return {
            data: { realms },
            status: HTTPStatus.OK,
        };
    };

    public getAuctions: QueryRequestHandler<
        IGetAuctionsResponse | IErrorResponse | IValidationErrorResponse
    > = async req => {
        let result: IGetAuctionsRequest | null = null;
        try {
            result = await AuctionsQueryParamsRules.validate(req.query);
        } catch (err) {
            const validationErrors: IValidationErrorResponse = { [err.path]: err.message };

            return {
                data: validationErrors,
                status: HTTPStatus.BAD_REQUEST,
            };
        }
        const { count, page, sortDirection, sortKind, ownerFilters, itemFilters } = result;

        const msg = await this.messenger.getAuctions({
            count,
            item_filters: itemFilters,
            owner_filters: ownerFilters,
            page,
            realm_slug: req.params["realmSlug"],
            region_name: req.params["regionName"],
            sort_direction: sortDirection,
            sort_kind: sortKind,
        });
        if (msg.code !== code.ok) {
            switch (msg.code) {
                case code.notFound:
                    return {
                        data: { error: msg.error!.message },
                        status: HTTPStatus.NOT_FOUND,
                    };
                case code.userError:
                    return {
                        data: { error: msg.error!.message },
                        status: HTTPStatus.BAD_REQUEST,
                    };
                default:
                    return {
                        data: { error: msg.error!.message },
                        status: HTTPStatus.INTERNAL_SERVER_ERROR,
                    };
            }
        }

        const itemIds = [...new Set(msg.data!.auctions.map(v => v.itemId))];
        const itemsMsg = await this.messenger.getItems(itemIds);
        if (itemsMsg.code !== code.ok) {
            return {
                data: { error: msg.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }

        const professionPricelists = await (async () => {
            if (itemIds.length === 0) {
                return [];
            }

            return this.dbConn
                .getRepository(ProfessionPricelist)
                .createQueryBuilder("professionpricelist")
                .leftJoinAndSelect("professionpricelist.pricelist", "pricelist")
                .leftJoinAndSelect("pricelist.entries", "entry")
                .where(`entry.itemId IN (${itemIds.join(", ")})`)
                .getMany();
        })();

        const pricelistItemIds = [...professionPricelists.map(v => v.pricelist!.entries!.map(y => y.itemId)[0])];
        const pricelistItemsMsg = await this.messenger.getItems(pricelistItemIds);
        if (pricelistItemsMsg.code !== code.ok) {
            return {
                data: { error: pricelistItemsMsg.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }

        return {
            data: {
                ...msg.data!,
                items: { ...itemsMsg.data!.items, ...pricelistItemsMsg.data!.items },
                professionPricelists: professionPricelists.map(v => v.toJson()),
            },
            status: HTTPStatus.OK,
        };
    };

    public getOwners: RequestHandler<IGetOwnersRequest, IGetOwnersResponse> = async req => {
        const { query } = req.body;
        const msg = await this.messenger.getOwners({
            query,
            realm_slug: req.params["realmSlug"],
            region_name: req.params["regionName"],
        });

        return {
            data: msg.data!,
            status: HTTPStatus.OK,
        };
    };

    public queryAuctions: RequestHandler<
        IQueryAuctionsRequest,
        IQueryAuctionsResponse | IErrorResponse
    > = async req => {
        const { query } = req.body;

        const [itemsQueryMessage, ownersQueryMessage] = await Promise.all([
            this.messenger.queryItems(query),
            this.messenger.queryOwners({
                query,
                realm_slug: req.params["realmSlug"],
                region_name: req.params["regionName"],
            }),
        ]);
        if (itemsQueryMessage.code !== code.ok || ownersQueryMessage.code !== code.ok) {
            return {
                data: { error: itemsQueryMessage.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }

        const getItemsMessage = await this.messenger.getItems(itemsQueryMessage.data!.items.map(v => v.item_id));
        if (getItemsMessage.code !== code.ok) {
            return {
                data: { error: itemsQueryMessage.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }
        const foundItems = getItemsMessage.data!.items;

        let items: IQueryAuctionsItem[] = [
            ...itemsQueryMessage.data!.items.map(v => {
                const result: IQueryAuctionsItem = {
                    item: v.item_id in foundItems ? foundItems[v.item_id] : null,
                    owner: null,
                    rank: v.rank,
                    target: v.target,
                };

                return result;
            }),
            ...ownersQueryMessage.data!.items.map(v => {
                const result: IQueryAuctionsItem = { ...v, item: null };

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

        return {
            data: { items },
            status: HTTPStatus.OK,
        };
    };

    public queryOwnerItems: RequestHandler<IQueryOwnerItemsRequest, IQueryOwnerItemsResponse> = async req => {
        const { items } = req.body;
        const msg = await this.messenger.queryOwnerItems({
            items,
            realm_slug: req.params["realmSlug"],
            region_name: req.params["regionName"],
        });

        return {
            data: msg.data!,
            status: HTTPStatus.OK,
        };
    };

    public queryItems: RequestHandler<IQueryItemsRequest, IQueryItemsResponse | IErrorResponse> = async req => {
        const { query } = req.body;

        // resolving items-query message
        const itemsQueryMessage = await this.messenger.queryItems(query);
        if (itemsQueryMessage.code !== code.ok) {
            return {
                data: { error: itemsQueryMessage.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }

        // resolving items from item-ids in items-query response data
        const getItemsMessage = await this.messenger.getItems(itemsQueryMessage.data!.items.map(v => v.item_id));
        if (getItemsMessage.code !== code.ok) {
            return {
                data: { error: itemsQueryMessage.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }
        const foundItems = getItemsMessage.data!.items;

        // formatting a response
        const data: IQueryItemsResponse = {
            items: itemsQueryMessage.data!.items.map(v => {
                return {
                    item: v.item_id in foundItems ? foundItems[v.item_id] : null,
                    rank: v.rank,
                    target: v.target,
                };
            }),
        };

        return {
            data,
            status: HTTPStatus.OK,
        };
    };

    public getPricelist: RequestHandler<IGetPricelistRequest, IGetPricelistResponse> = async req => {
        const { item_ids } = req.body;
        const price_list = (await this.messenger.getPriceList({
            item_ids,
            realm_slug: req.params["realmSlug"],
            region_name: req.params["regionName"],
        })).data!.price_list;
        const items = (await this.messenger.getItems(item_ids)).data!.items;

        return {
            data: { price_list, items },
            status: HTTPStatus.OK,
        };
    };

    public getPricelistHistories: RequestHandler<
        IGetPricelistHistoriesRequest,
        IGetPricelistHistoriesResponse
    > = async req => {
        const { item_ids } = req.body;
        const currentUnixTimestamp = Math.floor(Date.now() / 1000);
        const lowerBounds = currentUnixTimestamp - 60 * 60 * 24 * 14;
        let history = (await this.messenger.getPricelistHistories({
            item_ids,
            lower_bounds: lowerBounds,
            realm_slug: req.params["realmSlug"],
            region_name: req.params["regionName"],
            upper_bounds: currentUnixTimestamp,
        })).data!.history;
        const items = (await this.messenger.getItems(item_ids)).data!.items;

        // gathering unix timestamps for all items
        const historyUnixTimestamps: number[] = item_ids.reduce((previousHistoryUnixTimestamps: number[], itemId) => {
            if (!(itemId in history)) {
                return previousHistoryUnixTimestamps;
            }

            const itemUnixTimestamps = Object.keys(history[itemId]).map(Number);
            for (const itemUnixTimestamp of itemUnixTimestamps) {
                if (previousHistoryUnixTimestamps.indexOf(itemUnixTimestamp) > -1) {
                    continue;
                }

                previousHistoryUnixTimestamps.push(itemUnixTimestamp);
            }

            return previousHistoryUnixTimestamps;
        }, []);

        // normalizing all histories to have zeroed data where missing
        history = item_ids.reduce((previousHistory: IItemPricelistHistoryMap, itemId) => {
            // generating a full zeroed pricelist-history for this item
            if (!(itemId in history)) {
                const blankItemHistory: IPricelistHistoryMap = historyUnixTimestamps.reduce(
                    (previousBlankItemHistory: IPricelistHistoryMap, unixTimestamp) => {
                        const blankPrices: IPrices = {
                            average_buyout_per: 0,
                            max_buyout_per: 0,
                            median_buyout_per: 0,
                            min_buyout_per: 0,
                            volume: 0,
                        };

                        return {
                            ...previousBlankItemHistory,
                            [unixTimestamp]: blankPrices,
                        };
                    },
                    {},
                );

                return {
                    ...previousHistory,
                    [itemId]: blankItemHistory,
                };
            }

            // reforming the item-history with zeroed blank prices where none found
            const currentItemHistory = history[itemId];
            const newItemHistory: IPricelistHistoryMap = historyUnixTimestamps.reduce(
                (previousNewItemHistory: IPricelistHistoryMap, unixTimestamp) => {
                    if (!(unixTimestamp in currentItemHistory)) {
                        const blankPrices: IPrices = {
                            average_buyout_per: 0,
                            max_buyout_per: 0,
                            median_buyout_per: 0,
                            min_buyout_per: 0,
                            volume: 0,
                        };

                        return {
                            ...previousNewItemHistory,
                            [unixTimestamp]: blankPrices,
                        };
                    }

                    return {
                        ...previousNewItemHistory,
                        [unixTimestamp]: currentItemHistory[unixTimestamp],
                    };
                },
                {},
            );

            return {
                ...previousHistory,
                [itemId]: newItemHistory,
            };
        }, {});

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

            const itemPriceHistory: IPricelistHistoryMap = history[itemId];
            const itemPrices: IPrices[] = Object.keys(itemPriceHistory).map(v => itemPriceHistory[v]);
            if (itemPrices.length > 0) {
                const bands: IBollingerBands = boll(
                    itemPrices.map(v => v.min_buyout_per),
                    itemPrices.length > 4 ? 4 : itemPrices.length,
                );
                const minBandMid = bands.mid
                    .filter(v => !!v)
                    .reduce((previousValue, v) => {
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
                const maxBandUpper = bands.upper
                    .filter(v => !!v)
                    .reduce((previousValue, v) => {
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

        return {
            data: { history, items, itemPriceLimits, overallPriceLimits },
            status: HTTPStatus.OK,
        };
    };

    public getUnmetDemand: RequestHandler<
        IGetUnmetDemandRequest,
        IGetUnmetDemandResponse | IErrorResponse
    > = async req => {
        // gathering profession-pricelists
        const { expansion } = req.body;
        const professionPricelists = await this.dbConn.getRepository(ProfessionPricelist).find({
            where: { expansion },
        });

        // gathering included item-ids
        const itemIds = professionPricelists.reduce((previousValue: ItemId[], v: ProfessionPricelist) => {
            const pricelistItemIds = v.pricelist!.entries!.map(entry => entry.itemId);
            for (const itemId of pricelistItemIds) {
                if (previousValue.indexOf(itemId) === -1) {
                    previousValue.push(itemId);
                }
            }

            return previousValue;
        }, []);

        // gathering items
        const itemsMsg = await this.messenger.getItems(itemIds);
        if (itemsMsg.code !== code.ok) {
            return {
                data: { error: itemsMsg.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }
        const items = itemsMsg.data!.items;

        // gathering pricing data
        const msg = await this.messenger.getPriceList({
            item_ids: itemIds,
            realm_slug: req.params["realmSlug"],
            region_name: req.params["regionName"],
        });
        if (msg.code !== code.ok) {
            return {
                data: { error: msg.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }
        const msgData = msg.data!;

        // gathering unmet items
        const unmetItemIds = itemIds.filter(v => !(v.toString() in msgData.price_list));

        // filtering in unmet profession-pricelists
        const unmetProfessionPricelists = professionPricelists.filter(v => {
            const unmetPricelistItemIds = v
                .pricelist!.entries!.map(entry => entry.itemId)
                .filter(itemId => unmetItemIds.indexOf(itemId) > -1);

            return unmetPricelistItemIds.length > 0;
        });

        return {
            data: {
                items,
                professionPricelists: unmetProfessionPricelists.map(v => v.toJson()),
                unmetItemIds,
            },
            status: HTTPStatus.OK,
        };
    };

    public getProfessionPricelists: RequestHandler<null, IGetProfessionPricelistsResponse> = async req => {
        // gathering profession-pricelists
        const professionPricelists = await this.dbConn.getRepository(ProfessionPricelist).find({
            where: { name: req.params["profession_name"] },
        });

        // gathering related items
        const itemIds: ItemId[] = professionPricelists.reduce((pricelistItemIds: ItemId[], professionPricelist) => {
            return professionPricelist.pricelist!.entries!.reduce((entryItemIds: ItemId[], entry) => {
                if (entryItemIds.indexOf(entry.itemId) === -1) {
                    entryItemIds.push(entry.itemId);
                }

                return entryItemIds;
            }, pricelistItemIds);
        }, []);
        const items = (await this.messenger.getItems(itemIds)).data!.items;

        // dumping out a response
        return {
            data: { profession_pricelists: professionPricelists.map(v => v.toJson()), items },
            status: HTTPStatus.OK,
        };
    };
}
