import { IPricelistJson } from "../../../entities/pricelist";
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
    pricelist: IPricelistJson;
    entries: PricelistEntry[];
}

export interface IGetPricelistsResponse {
    pricelists: IPricelistJson[];
    items: IItemsMap;
}

export interface IGetPricelistResponse {
    pricelist: IPricelistJson;
}

export type IUpdatePricelistRequest = ICreatePricelistRequest;

export type IUpdatePricelistResponse = ICreatePricelistResponse;
