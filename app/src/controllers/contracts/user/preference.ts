import { Preference } from "../../../entities/preference";
import { realmSlug, regionName } from "../../../types/region";

export interface IGetPreferencesResponse {
    preference: Preference;
}

export interface ICreatePreferencesRequest {
    id?: number;
    user_id: number;
    current_region: regionName | null;
    current_realm: realmSlug | null;
}

export type ICreatePreferencesResponse = IGetPreferencesResponse;

export type IUpdatePreferencesRequest = ICreatePreferencesRequest;

export type IUpdatePreferencesResponse = IGetPreferencesResponse;
