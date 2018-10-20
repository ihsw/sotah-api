import { Pricelist } from "../../../entities/pricelist";
import { PricelistEntry } from "../../../entities/pricelist-entry";
import { IItemsMap } from "../../../types/item";

export interface ICreatePricelistRequest {
    pricelist: {
        name: string;
    };
    entries: Array<{
        id?: number;
        item_id: number;
        quantity_modifier: number;
    }>;
}

export interface ICreatePricelistResponse {
    pricelist: Pricelist;
    entries: PricelistEntry[];
}

export interface IGetPricelistsResponse {
    pricelists: Pricelist[];
    items: IItemsMap;
}

export interface IGetPricelistResponse {
    pricelist: Pricelist;
}

export type IUpdatePricelistRequest = ICreatePricelistRequest;

export type IUpdatePricelistResponse = ICreatePricelistResponse;
