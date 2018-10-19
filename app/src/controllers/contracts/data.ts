import { SortDirection, SortKind } from "../../types";
import { IAuction, IOwner, OwnerName } from "../../types/auction";
import { IExpansion } from "../../types/expansion";
import { IItem, IItemsMap, ItemId } from "../../types/item";
import { IItemClass } from "../../types/item-class";
import { IProfession } from "../../types/profession";
import { IRealm, IRegion } from "../../types/region";

export type IGetRegionsResponse = IRegion[];

export interface IGetItemsClassesResponse {
    classes: IItemClass[];
}

export interface IGetBootResponse {
    regions: IRegion[];
    item_classes: IItemClass[];
    expansions: IExpansion[];
    professions: IProfession[];
}

interface IStatusRealm extends IRealm {
    regionName: string;
}

export interface IGetRealmsResponse {
    realms: IStatusRealm[];
}

export interface IGetAuctionsRequest {
    count: number;
    page: number;
    sortKind: SortKind;
    sortDirection: SortDirection;
    ownerFilters: OwnerName[];
    itemFilters: ItemId[];
}

export interface IErrorResponse {
    error: string;
}

export interface IGetAuctionsResponse {
    auctions: IAuction[];
    total: number;
    total_count: number;
    items: IItemsMap;
}

export interface IGetOwnersRequest {
    query: string;
}

export interface IGetOwnersResponse {
    owners: OwnerName[];
}

export interface IQueryAuctionsRequest {
    query: string;
}

export interface IQueryAuctionsItem {
    target: string;
    item: IItem | null;
    owner: IOwner | null;
    rank: number;
}

export interface IQueryAuctionsResponse {
    items: IQueryAuctionsItem[];
}
