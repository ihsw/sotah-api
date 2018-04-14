import { realmSlug } from "./realm";

export interface IAuctions {
  realms: IAuctionRealm[] | null;
  auctions: IAuction[] | null;
}

export interface IAuctionRealm {
  name: string;
  slug: realmSlug;
}

export interface IAuction {
  auc: number;
  item: number;
  owner: string;
  ownerRealm: string;
  bid: number;
  buyout: number;
  quantity: number;
  timeLeft: string;
  rand: number;
  seed: number;
  context: number;
}
