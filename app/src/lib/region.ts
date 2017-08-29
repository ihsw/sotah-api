import { IRealm } from "./realm";

export type regionName = string;

export interface IRegion {
  name: regionName;
  hostname: string;
}

export interface IStatus {
  realms: IRealm[];
}