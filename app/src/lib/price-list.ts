import { regionName } from './region';
import { realmSlug } from './realm';
import { ItemId } from './auction';

export type PriceListRequestBody = {
  item_ids: ItemId[]
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