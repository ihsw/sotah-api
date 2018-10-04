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
  lower_bounds: number
  upper_bounds: number
};

export type Prices = {
  min_buyout_per: number
  max_buyout_per: number
  average_buyout_per: number
  median_buyout_per: number
  volume: number
};

export type PriceListMap = {
  [itemId: number]: Prices
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
  [unixTimestamp: number]: Prices
};

export type PricelistHistoryResponse = {
  history: {
    [itemId: number]: PricelistHistoryMap
  }
};
