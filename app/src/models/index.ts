import { Sequelize } from "sequelize";

import { appendPreferenceRelationships, createPreferenceModel, PreferenceModel } from "./preference";
import { appendPricelistRelationships, createPricelistModel, PricelistModel } from "./pricelist";
import { appendPricelistEntryRelationships, createPricelistEntryModel, PricelistEntryModel } from "./pricelist-entry";
import {
    appendProfessionPricelistRelationships,
    createProfessionPricelistModel,
    ProfessionPricelistModel,
} from "./profession-pricelist";
import { appendRelationships as appendUserRelationships, createModel as createUserModel, UserModel } from "./user";

export interface IModels {
    User: UserModel;
    Preference: PreferenceModel;
    Pricelist: PricelistModel;
    PricelistEntry: PricelistEntryModel;
    ProfessionPricelist: ProfessionPricelistModel;
}

export const createModels = (sequelize: Sequelize): IModels => {
    let User = createUserModel(sequelize);
    let Preference = createPreferenceModel(sequelize);
    let Pricelist = createPricelistModel(sequelize);
    let PricelistEntry = createPricelistEntryModel(sequelize);
    let ProfessionPricelist = createProfessionPricelistModel(sequelize);

    User = appendUserRelationships(User, Preference, Pricelist);
    Preference = appendPreferenceRelationships(Preference, User);
    Pricelist = appendPricelistRelationships(Pricelist, PricelistEntry, User, ProfessionPricelist);
    PricelistEntry = appendPricelistEntryRelationships(PricelistEntry, Pricelist);
    ProfessionPricelist = appendProfessionPricelistRelationships(ProfessionPricelist, Pricelist);

    return { User, Preference, Pricelist, PricelistEntry, ProfessionPricelist };
};
