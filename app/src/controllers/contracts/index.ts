import { Pricelist } from "../../entities";
import { IItemsMap } from "../../types/item";

export interface IGetUserPricelistsResponse {
    items: IItemsMap;
    pricelists: Pricelist[];
}

export interface IErrorResponse {
    error: string;
}

export interface IValidationErrorResponse {
    [path: string]: string;
}
