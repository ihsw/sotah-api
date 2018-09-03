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

export enum InventoryType {
  None,
  Head,
  Neck,
  Shoulder,
  Shirt,
  Chest,
  Waist,
  Legs,
  Feet,
  Wrist,
  Hands,
  Finger,
  Trinket,
  OneHand,
  Shield,
  Ranged,
  Cloak,
  TwoHand,
  Bag,
  Tabard,
  Robe,
  MainHand,
  OffHand,
  HeldInOffHand,
  Ammo,
  Thrown,
  RangedRight,
  Relic
}

export enum ItemBind { none, bindOnPickup, bindOnEquip }

type ItemClassClass = number;

type SubItemClassClass = number;

type ItemSpellId = number;

type ItemSpellSpell = {
  id: ItemSpellId
  name: string
  icon: string
  description: string
  castTime: string
};

export enum ItemSpellTrigger {
  OnProc = "ON_PROC",
  OnUse = "ON_USE",
  OnLearn = "ON_LEARN",
  OnLooted = "ON_LOOTED",
  OnPickup = "ON_PICKUP",
  OnEquip = "ON_EQUIP"
}

type ItemSpell = {
  spellId: ItemSpellId
  nCharges: number
  consumable: boolean
  categoryId: number
  trigger: ItemSpellTrigger
  spell: ItemSpellSpell
};

type ItemWeaponDamage = {
  min: number
  max: number
  exactMin: number
  exactMax: number
};

type ItemWeaponInfo = {
  damage: ItemWeaponDamage
  weaponSpeed: number
  dps: number
};

type ItemBonusStat = {
  stat: number
  amount: number
};

export type Item = {
  id: ItemId
  name: string
  normalized_name: string
  quality: ItemQuality
  icon: string
  itemLevel: number
  itemClass: ItemClassClass
  itemSubClass: SubItemClassClass
  inventoryType: InventoryType
  itemBind: ItemBind
  requiredLevel: number
  armor: number
  maxDurability: number
  sellPrice: number
  itemSpells: ItemSpell[]
  equippable: boolean
  stackable: number
  weaponInfo: ItemWeaponInfo
  bonusStats: ItemBonusStat[]
  description: string
  icon_url: string
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
  itemId: ItemId
  owner: OwnerName
  ownerRealm: string
  bid: number
  buyout: number
  buyoutPer: number
  quantity: number
  timeLeft: string
  aucList: number[]
};

export type subItemClass = {
  subclass: number
  name: string
};

export type ItemClass = {
  class: number
  name: string
  subclasses: subItemClass[]
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
  page: number
  count: number
  sort_kind: SortKind
  sort_direction: SortDirection
  owner_filters: OwnerName[]
  item_filters: ItemId[]
};

export type AuctionsResponse = {
  auctions: Auction[]
  total: number
  total_count: number
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

export type ItemsResponseItem = {
  item: Item
  target: string
  rank: number
};

export type ItemsQueryResponse = {
  items: ItemsResponseItem[]
};

// owners-query
export type OwnersQueryRequest = {
  query: string
  region_name: regionName
  realm_slug: realmSlug
};

export type OwnersQueryItem = {
  target: string
  owner: Owner
  rank: number
};

export type OwnersQueryResponse = {
  items: OwnersQueryItem[]
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
  rank: number
};

export type AuctionsQueryResponse = {
  items: AuctionsQueryItem[]
};

export type ItemClassesResponse = {
  classes: ItemClass[]
};

export type ItemsMap = {
  [key: number]: Item
};

export type ItemsResponse = {
  items: ItemsMap
};

export type OwnersQueryByItemsRequest = {
  region_name: regionName
  realm_slug: realmSlug
  items: ItemId[]
};

export type OwnersQueryByItemsRequestBody = {
  items: ItemId[]
};

export type OwnerItemsOwnership = {
  owned_value: number;
  owned_volume: number;
};

export type OwnerItemsOwnershipMap = {
  [ownerName: string]: OwnerItemsOwnership
};

export type OwnersQueryByItemsResponse = {
  total_value: number
  total_volume: number
  ownership: OwnerItemsOwnershipMap
};
