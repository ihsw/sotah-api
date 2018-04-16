import { regionName } from "./region";
import { realmSlug } from "./realm";

export type AuctionsRequest = {
  regionName: regionName
  realmSlug: realmSlug
  count: number
  page: number
};

export type AuctionsResponse = {
  realms: AuctionRealm[] | null
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
