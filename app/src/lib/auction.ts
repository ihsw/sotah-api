import { regionName } from "./region";
import { realmSlug } from "./realm";

export enum SortDirection { none, up, down }

export enum SortKind { none, item, quantity, bid, buyout, auctions, owner }

export type OwnerName = string;

export type AuctionsRequestBody = {
  count: number
  page: number
  sortKind: SortKind
  sortDirection: SortDirection
};

export type AuctionsRequest = {
  region_name: regionName
  realm_slug: realmSlug
  count: number
  page: number
  sort_kind: SortKind
  sort_direction: SortDirection
  owner_filter: OwnerName
};

export type AuctionsResponse = {
  total: number
  total_count: number
  auctions: Auction[] | null
};

export type AuctionRealm = {
  name: string
  slug: realmSlug
};

export type Auction = {
  item: number
  owner: OwnerName
  ownerRealm: string
  bid: number
  buyout: number
  quantity: number
  timeLeft: string
  aucList: number[]
};

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
