import { OwnerName } from "./auction";
import { ItemId } from "./item";

export enum SortDirection {
    none,
    up,
    down,
}

export enum SortKind {
    none,
    item,
    quantity,
    bid,
    buyout,
    buyoutPer,
    auctions,
    owner,
}

// various types

/**
 * request-body, request, and responses
 */
// auctions

// items
export interface IItemsRequestBody {
    query: string;
}

// owners-query

// auctions-query

export interface IOwnersQueryByItemsRequestBody {
    items: ItemId[];
}
