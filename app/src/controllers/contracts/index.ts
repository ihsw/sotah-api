import { Pricelist } from "../../entities";
import { IItemsMap } from "../../types/item";

export interface IGetUserPricelistsResponse {
    items: IItemsMap;
    pricelists: Pricelist[];
}
