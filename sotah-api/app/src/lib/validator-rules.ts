import * as yup from "yup";

export const PreferenceRules = yup.object().shape({
  current_realm: yup.string(),
  current_region: yup.string()
}).noUnknown();

export const PriceListEntryRules = yup.object().shape({
  id: yup.number(),
  item_id: yup.number().required(),
  quantity_modifier: yup.number().required()
}).noUnknown();

export const PricelistRules = yup.object().shape({
  name: yup.string().required(),
  realm: yup.string().required(),
  region: yup.string().required()
}).noUnknown();

export const PricelistRequestBodyRules = yup.object().shape({
  entries: yup.array(PriceListEntryRules).required(),
  pricelist: PricelistRules.required()
}).noUnknown();

export const UserRequestBodyRules = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(6).required()
}).noUnknown();