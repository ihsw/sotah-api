import { regionName } from "./region";
import { realmSlug } from "./realm";

export type AuctionsRequest = {
  region_name: regionName
  realm_slug: realmSlug
  count: number
  page: number
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
  owner: string
  ownerRealm: string
  bid: number
  buyout: number
  quantity: number
  timeLeft: string
  aucList: number[]
};
