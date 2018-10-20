import * as boll from "bollinger-bands";
import * as HTTPStatus from "http-status";

import { code, Messenger } from "../lib/messenger";
import {
    IBollingerBands,
    IItemMarketPrices,
    IItemPriceLimits,
    IPriceLimits,
    IPricelistHistoryMap,
    IPrices,
} from "../types/pricelist";
import {
    IErrorResponse,
    IGetAuctionsRequest,
    IGetAuctionsResponse,
    IGetBootResponse,
    IGetItemsClassesResponse,
    IGetOwnersRequest,
    IGetOwnersResponse,
    IGetPricelistHistoriesRequest,
    IGetPricelistHistoriesResponse,
    IGetPricelistRequest,
    IGetPricelistResponse,
    IGetRealmsResponse,
    IGetRegionsResponse,
    IQueryAuctionsItem,
    IQueryAuctionsRequest,
    IQueryAuctionsResponse,
    IQueryItemsRequest,
    IQueryItemsResponse,
    IQueryOwnerItemsRequest,
    IQueryOwnerItemsResponse,
} from "./contracts/data";
import { RequestHandler } from "./index";

export class DataController {
    private messenger: Messenger;

    constructor(messenger: Messenger) {
        this.messenger = messenger;
    }

    public getRegions: RequestHandler<null, IGetRegionsResponse> = async () => {
        const msg = await this.messenger.getRegions();
        return { data: msg.data!, status: HTTPStatus.OK };
    };

    public getItemClasses: RequestHandler<null, IGetItemsClassesResponse> = async () => {
        const msg = await this.messenger.getItemClasses();
        return { data: msg.data!, status: HTTPStatus.OK };
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

        return {
            data: {
                realms: msg.data!.realms.map(realm => {
                    return { ...realm, regionName: req.params["regionName"] };
                }),
            },
            status: HTTPStatus.OK,
        };
    };

    public getAuctions: RequestHandler<IGetAuctionsRequest, IGetAuctionsResponse | IErrorResponse> = async req => {
        const { count, page, sortDirection, sortKind, ownerFilters, itemFilters } = req.body;

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
        switch (msg.code) {
            case code.ok:
                const itemIds = msg.data!.auctions.map(v => v.itemId);
                const itemsMsg = await this.messenger.getItems(itemIds);
                if (itemsMsg.code !== code.ok) {
                    return {
                        data: { error: msg.error!.message },
                        status: HTTPStatus.INTERNAL_SERVER_ERROR,
                    };
                }

                return {
                    data: { ...msg.data!, items: itemsMsg.data!.items },
                    status: HTTPStatus.OK,
                };
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

        const itemsMessage = await this.messenger.queryItems(query);
        if (itemsMessage.code !== code.ok) {
            return {
                data: { error: itemsMessage.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }

        const ownersMessage = await this.messenger.queryOwners({
            query,
            realm_slug: req.params["realmSlug"],
            region_name: req.params["regionName"],
        });
        if (ownersMessage.code !== code.ok) {
            return {
                data: { error: ownersMessage.error!.message },
                status: HTTPStatus.INTERNAL_SERVER_ERROR,
            };
        }

        let items: IQueryAuctionsItem[] = [
            ...itemsMessage.data!.items.map(v => {
                const result: IQueryAuctionsItem = { ...v, owner: null };

                return result;
            }),
            ...ownersMessage.data!.items.map(v => {
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

    public queryItems: RequestHandler<IQueryItemsRequest, IQueryItemsResponse> = async req => {
        const { query } = req.body;
        const msg = await this.messenger.queryItems(query);

        return {
            data: msg.data!,
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
        const history = (await this.messenger.getPricelistHistories({
            item_ids,
            lower_bounds: lowerBounds,
            realm_slug: req.params["realmSlug"],
            region_name: req.params["regionName"],
            upper_bounds: currentUnixTimestamp,
        })).data!.history;
        const items = (await this.messenger.getItems(item_ids)).data!.items;

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

            const itemPriceHistory: IPricelistHistoryMap = history[itemId];
            const itemPrices: IPrices[] = Object.keys(itemPriceHistory).map(v => itemPriceHistory[v]);
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

        return {
            data: { history, items, itemPriceLimits, overallPriceLimits, itemMarketPrices },
            status: HTTPStatus.OK,
        };
    };
}
