import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Preference } from "../../entities/preference";
import { PreferenceRules } from "../../lib/validator-rules";
import { IErrorResponse, IValidationErrorResponse } from "../contracts";
import {
    ICreatePreferencesRequest,
    ICreatePreferencesResponse,
    IGetPreferencesResponse,
    IUpdatePreferencesRequest,
    IUpdatePreferencesResponse,
} from "../contracts/user/preferences";
import { RequestHandler } from "../index";

export class PreferencesController {
    private dbConn: Connection;

    constructor(dbConn: Connection) {
        this.dbConn = dbConn;
    }

    public getPreferences: RequestHandler<null, IGetPreferencesResponse | null> = async req => {
        const user = req.user!;
        const preference = await this.dbConn.getRepository(Preference).findOne({ where: { user: { id: user.id } } });

        if (typeof preference === "undefined") {
            return {
                data: null,
                status: HTTPStatus.NOT_FOUND,
            };
        }

        return {
            data: { preference: preference.toJson() },
            status: HTTPStatus.OK,
        };
    };

    public createPreferences: RequestHandler<
        ICreatePreferencesRequest,
        ICreatePreferencesResponse | IErrorResponse | IValidationErrorResponse
    > = async req => {
        const user = req.user!;
        let preference = await this.dbConn.getRepository(Preference).findOne({ where: { user: { id: user.id } } });
        if (typeof preference !== "undefined") {
            return {
                data: { error: "User already has preferences." },
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        let result: ICreatePreferencesRequest | null = null;
        try {
            result = (await PreferenceRules.validate(req.body)) as ICreatePreferencesRequest;
        } catch (err) {
            const preferencesValidationResponse: IValidationErrorResponse = err.errors;

            return {
                data: preferencesValidationResponse,
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        preference = new Preference();
        preference.user = user;
        preference.currentRealm = result.current_realm;
        preference.currentRegion = result.current_region;
        await this.dbConn.manager.save(preference);
        return {
            data: { preference: preference.toJson() },
            status: HTTPStatus.CREATED,
        };
    };

    public updatePreferences: RequestHandler<
        IUpdatePreferencesRequest,
        IUpdatePreferencesResponse | IErrorResponse | IValidationErrorResponse | null
    > = async req => {
        const user = req.user!;
        const preference = await this.dbConn.getRepository(Preference).findOne({ where: { user_id: user.id } });

        if (typeof preference === "undefined") {
            return {
                data: null,
                status: HTTPStatus.NOT_FOUND,
            };
        }

        let result: IUpdatePreferencesRequest | null = null;
        try {
            result = (await PreferenceRules.validate(req.body)) as IUpdatePreferencesRequest;
        } catch (err) {
            const preferencesValidationResponse: IValidationErrorResponse = err.errors;

            return {
                data: preferencesValidationResponse,
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        preference.currentRealm = result.current_realm;
        preference.currentRegion = result.current_region;
        await this.dbConn.manager.save(preference);
        return {
            data: { preference: preference.toJson() },
            status: HTTPStatus.OK,
        };
    };
}
