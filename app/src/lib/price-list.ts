import { IProfessionPricelistAttributes } from "../models/profession-pricelist";
import { IItemsMap, ItemId } from "./auction";
import { ExpansionName } from "./expansion";
import { realmSlug } from "./realm";
import { regionName } from "./region";

export interface IPriceListRequestBody {
    item_ids: ItemId[];
}

export interface IUnmetDemandRequestBody {
    expansion: ExpansionName;
}

export interface IUnmetDemandResponseBody {
    items: IItemsMap;
    professionPricelists: IProfessionPricelistAttributes[];
}

export interface IPriceListRequest {
    region_name: regionName;
    realm_slug: realmSlug;
    item_ids: ItemId[];
}

export interface IPrices {
    min_buyout_per: number;
    max_buyout_per: number;
    average_buyout_per: number;
    median_buyout_per: number;
    volume: number;
}

export interface IPriceListMap {
    [itemId: number]: IPrices;
}

export interface IPriceListResponse {
    price_list: IPriceListMap;
}

export interface IPricelistHistoryRequest {
    region_name: regionName;
    realm_slug: realmSlug;
    item_ids: ItemId[];
    lower_bounds: number;
    upper_bounds: number;
}

export interface IPricelistHistoryMap {
    [unixTimestamp: number]: IPrices;
}

export interface IPricelistHistoryResponse {
    history: {
        [itemId: number]: IPricelistHistoryMap;
    };
}
