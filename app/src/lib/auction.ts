import { regionName } from "./region";
import { realmSlug } from "./realm";

export enum SortDirection { none, up, down }

export enum SortKind { none, item, quantity, bid, buyout, buyoutPer, auctions, owner }

// various types
export type OwnerName = string;

export type ItemId = number;

export enum ItemQuality {
  Poor,
  Common,
  Uncommon,
  Rare,
  Epic,
  Legendary,
  Artifact,
  Heirloom
}

export type Item = {
  id: ItemId
  name: string
  normalized_name: string
  quality: ItemQuality
};

export type Owner = {
  name: OwnerName
  normalized_name: string
};

export type AuctionRealm = {
  name: string
  slug: realmSlug
};

export type Auction = {
  item: Item
  owner: OwnerName
  ownerRealm: string
  bid: number
  buyout: number
  buyoutPer: number
  quantity: number
  timeLeft: string
  aucList: number[]
};

/**
 * request-body, request, and responses
 */
// auctions
export type AuctionsRequestBody = {
  count: number
  page: number
  sortKind: SortKind
  sortDirection: SortDirection
  ownerFilters: OwnerName[]
  itemFilters: ItemId[]
};

export type AuctionsRequest = {
  region_name: regionName
  realm_slug: realmSlug
  count: number
  page: number
  sort_kind: SortKind
  sort_direction: SortDirection
  owner_filters: OwnerName[]
  item_filters: ItemId[]
};

export type AuctionsResponse = {
  total: number
  total_count: number
  auctions: Auction[] | null
};

// owners
export type OwnersRequestBody = {
  query: string
};

export type OwnersRequest = {
  query: string
  region_name: regionName
  realm_slug: realmSlug
};

export type OwnersResponse = {
  owners: OwnerName[]
};

// items
export type ItemsRequestBody = {
  query: string
};

export type ItemsResponse = {
  items: Item[]
};

// auctions-query
export type AuctionsQueryRequestBody = {
  query: string
};

export type AuctionsQueryRequest = {
  query: string
  region_name: regionName
  realm_slug: realmSlug
};

export type AuctionsQueryItem = {
  target: string
  item: Item
  owner: Owner
};

export type AuctionsQueryResponse = {
  items: AuctionsQueryItem[]
};
