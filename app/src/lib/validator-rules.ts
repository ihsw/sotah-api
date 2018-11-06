import * as yup from "yup";

import { ICreatePostRequest } from "../types/contracts/user/post-crud";
import { ICreatePreferencesRequest } from "../types/contracts/user/preferences";

export const PreferenceRules = yup
    .object<ICreatePreferencesRequest>()
    .shape({
        current_realm: yup.string(),
        current_region: yup.string(),
    })
    .noUnknown();

export const PriceListEntryRules = yup
    .object()
    .shape({
        id: yup.number(),
        item_id: yup.number().required(),
        quantity_modifier: yup.number().required(),
    })
    .noUnknown();

export const PricelistRules = yup
    .object()
    .shape({
        name: yup.string().required(),
    })
    .noUnknown();

export const PricelistRequestBodyRules = yup
    .object()
    .shape({
        entries: yup.array(PriceListEntryRules).required(),
        pricelist: PricelistRules.required(),
    })
    .noUnknown();

export const ProfessionPricelistRequestBodyRules = yup
    .object()
    .shape({
        entries: yup.array(PriceListEntryRules).required(),
        expansion_name: yup.string().required(),
        pricelist: PricelistRules.required(),
        profession_name: yup.string().required(),
    })
    .noUnknown();

export const UserRequestBodyRules = yup
    .object()
    .shape({
        email: yup
            .string()
            .email("Email must be a valid email")
            .required("Email is required"),
        password: yup
            .string()
            .min(6, "Password must be at least 6 characters")
            .required("Password is required"),
    })
    .noUnknown();

export const PostRequestBodyRules = yup
    .object<ICreatePostRequest>()
    .shape({ title: yup.string().required("Post title is requred") })
    .noUnknown();
