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
  auctions: Auction[] | null
};

export type AuctionRealm = {
  name: string
  slug: realmSlug
};

export type Auction = {
  auc: number
  item: number
  owner: string
  ownerRealm: string
  bid: number
  buyout: number
  quantity: number
  timeLeft: string
  rand: number
  seed: number
  context: number
};
