import * as yup from "yup";

import { PostRepository } from "../entities/post-repository";
import { IGetAuctionsRequest } from "../types/contracts/data";
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
        slug: yup
            .string()
            .min(4)
            .matches(/^[a-z|0-9|_|\-]+$/)
            .required(),
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
    .shape({
        body: yup.string().required("Body is required"),
        slug: yup
            .string()
            .min(4, "Post slug must be 4 characters")
            .matches(/^[a-z|0-9|_|\-]+$/, "Post slug must be a-z, 0-9, or underscore")
            .required("Post slug is requred"),
        summary: yup.string().required("Summary is required"),
        title: yup.string().required("Post title is requred"),
    })
    .noUnknown();

export const FullPostRequestBodyRules = (repo: PostRepository, exceptSlug?: string) =>
    yup
        .object<ICreatePostRequest>()
        .shape({
            body: yup.string().required("Body is required"),
            slug: yup
                .string()
                .min(4, "Post slug must be 4 characters")
                .matches(/^[a-z|0-9|_|\-]+$/, "Post slug must be a-z, 0-9, or underscore")
                .required("Post slug is requred")
                .test("is-unique", "Post must be unique", v => repo.hasNoSlug(v, exceptSlug)),
            summary: yup.string().required("Summary is required"),
            title: yup.string().required("Post title is requred"),
        })
        .noUnknown();

export const AuctionsQueryParamsRules = yup
    .object<IGetAuctionsRequest>()
    .shape({
        count: yup
            .number()
            .integer("Count must be an integer")
            .required("Count is required"),
        itemFilters: yup.array(yup.number().integer("Item-id must be an integer")),
        ownerFilters: yup.array(yup.string().required("Owner-name is required")),
        page: yup
            .number()
            .integer("Page must be an integer")
            .required("Page is required"),
        sortDirection: yup
            .number()
            .integer("Sort-direction must be an integer")
            .required("Sort-direction is required"),
        sortKind: yup
            .number()
            .integer("Sort-kind must be an integer")
            .required("Sort-kind is required"),
    })
    .noUnknown();
