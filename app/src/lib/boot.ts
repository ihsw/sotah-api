import { IRegion } from "./region";
import { ItemClass } from "./auction";
import { IExpansion } from "./expansion";
import { IProfession } from "./profession";

export type BootResponse = {
  regions: IRegion[]
  item_classes: ItemClass[]
  expansions: IExpansion[]
  professions: IProfession[]
};