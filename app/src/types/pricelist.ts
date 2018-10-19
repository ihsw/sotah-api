export interface IPrices {
    min_buyout_per: number;
    max_buyout_per: number;
    average_buyout_per: number;
    median_buyout_per: number;
    volume: number;
}

export interface IPriceListMap {
    [itemId: number]: IPrices;
}

export interface IPricelistHistoryMap {
    [unixTimestamp: number]: IPrices;
}