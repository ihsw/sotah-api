import { realmSlug } from "./realm";
import { regionName } from "./region";

export enum SortDirection {
    none,
    up,
    down,
}

export enum SortKind {
    none,
    item,
    quantity,
    bid,
    buyout,
    buyoutPer,
    auctions,
    owner,
}

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
    Heirloom,
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
    Relic,
}

export enum ItemBind {
    none,
    bindOnPickup,
    bindOnEquip,
}

type ItemClassClass = number;

type SubItemClassClass = number;

type ItemSpellId = number;

interface IItemSpellSpell {
    id: ItemSpellId;
    name: string;
    icon: string;
    description: string;
    castTime: string;
}

export enum ItemSpellTrigger {
    OnProc = "ON_PROC",
    OnUse = "ON_USE",
    OnLearn = "ON_LEARN",
    OnLooted = "ON_LOOTED",
    OnPickup = "ON_PICKUP",
    OnEquip = "ON_EQUIP",
}

interface IItemSpell {
    spellId: ItemSpellId;
    nCharges: number;
    consumable: boolean;
    categoryId: number;
    trigger: ItemSpellTrigger;
    spell: IItemSpellSpell;
}

interface IItemWeaponDamage {
    min: number;
    max: number;
    exactMin: number;
    exactMax: number;
}

interface IItemWeaponInfo {
    damage: IItemWeaponDamage;
    weaponSpeed: number;
    dps: number;
}

interface IItemBonusStat {
    stat: number;
    amount: number;
}

export interface IItem {
    id: ItemId;
    name: string;
    normalized_name: string;
    quality: ItemQuality;
    icon: string;
    itemLevel: number;
    itemClass: ItemClassClass;
    itemSubClass: SubItemClassClass;
    inventoryType: InventoryType;
    itemBind: ItemBind;
    requiredLevel: number;
    armor: number;
    maxDurability: number;
    sellPrice: number;
    itemSpells: IItemSpell[];
    equippable: boolean;
    stackable: number;
    weaponInfo: IItemWeaponInfo;
    bonusStats: IItemBonusStat[];
    description: string;
    icon_url: string;
}

export interface IOwner {
    name: OwnerName;
    normalized_name: string;
}

export interface IAuctionRealm {
    name: string;
    slug: realmSlug;
}

export interface IAuction {
    itemId: ItemId;
    owner: OwnerName;
    ownerRealm: string;
    bid: number;
    buyout: number;
    buyoutPer: number;
    quantity: number;
    timeLeft: string;
    aucList: number[];
}

export interface ISubItemClass {
    subclass: number;
    name: string;
}

export interface IItemClass {
    class: number;
    name: string;
    subclasses: ISubItemClass[];
}

/**
 * request-body, request, and responses
 */
// auctions
export interface IAuctionsRequestBody {
    count: number;
    page: number;
    sortKind: SortKind;
    sortDirection: SortDirection;
    ownerFilters: OwnerName[];
    itemFilters: ItemId[];
}

export interface IAuctionsRequest {
    region_name: regionName;
    realm_slug: realmSlug;
    page: number;
    count: number;
    sort_kind: SortKind;
    sort_direction: SortDirection;
    owner_filters: OwnerName[];
    item_filters: ItemId[];
}

export interface IAuctionsResponse {
    auctions: IAuction[];
    total: number;
    total_count: number;
}

// owners
export interface IOwnersRequestBody {
    query: string;
}

export interface IOwnersRequest {
    query: string;
    region_name: regionName;
    realm_slug: realmSlug;
}

export interface IOwnersResponse {
    owners: OwnerName[];
}

// items
export interface IItemsRequestBody {
    query: string;
}

export interface IItemsResponseItem {
    item: IItem;
    target: string;
    rank: number;
}

export interface IItemsQueryResponse {
    items: IItemsResponseItem[];
}

// owners-query
export interface IOwnersQueryRequest {
    query: string;
    region_name: regionName;
    realm_slug: realmSlug;
}

export interface IOwnersQueryItem {
    target: string;
    owner: IOwner;
    rank: number;
}

export interface IOwnersQueryResponse {
    items: IOwnersQueryItem[];
}

// auctions-query
export interface IAuctionsQueryRequestBody {
    query: string;
}

export interface IAuctionsQueryItem {
    target: string;
    item: IItem | null;
    owner: IOwner | null;
    rank: number;
}

export interface IAuctionsQueryResponse {
    items: IAuctionsQueryItem[];
}

export interface IItemClassesResponse {
    classes: IItemClass[];
}

export interface IItemsMap {
    [key: number]: IItem;
}

export interface IItemsResponse {
    items: IItemsMap;
}

export interface IOwnersQueryByItemsRequest {
    region_name: regionName;
    realm_slug: realmSlug;
    items: ItemId[];
}

export interface IOwnersQueryByItemsRequestBody {
    items: ItemId[];
}

export interface IOwnerItemsOwnership {
    owned_value: number;
    owned_volume: number;
}

export interface IOwnerItemsOwnershipMap {
    [ownerName: string]: IOwnerItemsOwnership;
}

export interface IOwnersQueryByItemsResponse {
    total_value: number;
    total_volume: number;
    ownership: IOwnerItemsOwnershipMap;
}
