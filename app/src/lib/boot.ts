import { IItemClass } from "./auction";
import { IExpansion } from "./expansion";
import { IProfession } from "./profession";
import { IRegion } from "./region";

export interface IBootResponse {
    regions: IRegion[];
    item_classes: IItemClass[];
    expansions: IExpansion[];
    professions: IProfession[];
}
