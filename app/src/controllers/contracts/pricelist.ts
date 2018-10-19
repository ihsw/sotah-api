import { ProfessionPricelist } from "../../entities";
import { ExpansionName } from "../../types/expansion";
import { IItemsMap, ItemId } from "../../types/item";

export interface IPriceListRequestBody {
    item_ids: ItemId[];
}

export interface IUnmetDemandRequestBody {
    expansion: ExpansionName;
}

export interface IUnmetDemandResponseBody {
    items: IItemsMap;
    professionPricelists: ProfessionPricelist[];
}
