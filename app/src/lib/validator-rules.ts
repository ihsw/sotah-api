import * as yup from "yup";

export const PreferenceRules = yup.object().shape({
  current_realm: yup.string(),
  current_region: yup.string()
}).noUnknown();

export const PriceListEntryRules = yup.object().shape({
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
});
