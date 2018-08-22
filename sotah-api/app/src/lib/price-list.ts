import { ExpansionName } from "./expansion";
import { regionName } from "./region";
import { realmSlug } from "./realm";
import { ItemId } from "./auction";
import { ProfessionPricelistAttributes } from "../models/profession-pricelist";

export type PriceListRequestBody = {
  item_ids: ItemId[]
};

export type UnmetDemandRequestBody = {
  expansion: ExpansionName;
};

export type UnmetDemandItem = {
  professionPricelist: ProfessionPricelistAttributes;
  pricelistMap: PriceListMap;
};

export type UnmetDemandResponseBody = {
  items: UnmetDemandItem[];
};

export type PriceListRequest = {
  region_name: regionName
  realm_slug: realmSlug
  item_ids: ItemId[]
};

export type PriceListMap = {
  [key: number]: {
    bid: number
    buyout: number
  }
};

export type PriceListResponse = {
  price_list: PriceListMap
};
