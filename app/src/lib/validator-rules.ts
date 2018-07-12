import * as yup from "yup";

export const PreferenceRules = yup.object().shape({
  current_region: yup.string()
}).noUnknown();
