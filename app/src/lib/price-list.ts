import { ExpansionName } from "./expansion";
import { regionName } from "./region";
import { realmSlug } from "./realm";
import { ItemId, ItemsMap } from "./auction";
import { ProfessionPricelistAttributes } from "../models/profession-pricelist";

export type PriceListRequestBody = {
  item_ids: ItemId[]
};

export type UnmetDemandRequestBody = {
  expansion: ExpansionName;
};

export type UnmetDemandResponseBody = {
  items: ItemsMap;
  professionPricelists: ProfessionPricelistAttributes[];
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
    volume: number
  }
};

export type PriceListResponse = {
  price_list: PriceListMap
};

export type PricelistHistoryRequest = {
  region_name: regionName
  realm_slug: realmSlug
  item_ids: ItemId[]
};

export type PricelistHistoryMap = {
  [key: number]: PriceListMap
};

export type PricelistHistoryResponse = {
  history: PricelistHistoryMap
};
