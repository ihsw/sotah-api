import { SortDirection, SortKind } from "../../../types";
import { IAuction, IOwner, OwnerName } from "../../../types/auction";
import { IExpansion } from "../../../types/expansion";
import { IItemsMap, ItemId } from "../../../types/item";
import { IItemClass } from "../../../types/item-class";
import { IPricelistHistoryMap, IPriceListMap } from "../../../types/pricelist";
import { IProfession } from "../../../types/profession";
import { IRealmModificationDates, IRegion, RealmSlug, RegionName } from "../../../types/region";

export interface IGetAuctionsRequest {
    region_name: RegionName;
    realm_slug: RealmSlug;
    page: number;
    count: number;
    sort_kind: SortKind;
    sort_direction: SortDirection;
    owner_filters: OwnerName[];
    item_filters: ItemId[];
}

export interface IGetAuctionsResponse {
    auctions: IAuction[];
    total: number;
    total_count: number;
}

export interface IGetPricelistRequest {
    region_name: RegionName;
    realm_slug: RealmSlug;
    item_ids: ItemId[];
}

export interface IGetPricelistResponse {
    price_list: IPriceListMap;
}

export interface IGetOwnersRequest {
    query: string;
    region_name: RegionName;
    realm_slug: RealmSlug;
}

export interface IGetOwnersResponse {
    owners: OwnerName[];
}

export interface IGetSessionSecretResponse {
    session_secret: string;
}

export interface IQueryItemsResponse {
    items: Array<{
        item_id: ItemId;
        target: string;
        rank: number;
    }>;
}

export interface IQueryOwnersRequest {
    query: string;
    region_name: RegionName;
    realm_slug: RealmSlug;
}

export interface IQueryOwnersResponse {
    items: Array<{
        target: string;
        owner: IOwner;
        rank: number;
    }>;
}

export interface IGetItemsResponse {
    items: IItemsMap;
}

export interface IGetBootResponse {
    regions: IRegion[];
    item_classes: {
        classes: IItemClass[];
    };
    expansions: IExpansion[];
    professions: IProfession[];
}

export interface IGetPricelistHistoriesRequest {
    region_name: RegionName;
    realm_slug: RealmSlug;
    item_ids: ItemId[];
    lower_bounds: number;
    upper_bounds: number;
}

export interface IItemPricelistHistoryMap {
    [itemId: number]: IPricelistHistoryMap;
}

export interface IGetPricelistHistoriesResponse {
    history: IItemPricelistHistoryMap;
}

export interface IQueryOwnerItemsRequest {
    region_name: RegionName;
    realm_slug: RealmSlug;
    items: ItemId[];
}

export interface IQueryOwnerItemsResponse {
    total_value: number;
    total_volume: number;
    ownership: {
        [ownerName: string]: {
            owned_value: number;
            owned_volume: number;
        };
    };
}

export interface IRealmModificationDatesRequest {
    region_name: RegionName;
    realm_slug: RealmSlug;
}

export type IRealmModificationDatesResponse = IRealmModificationDates;
