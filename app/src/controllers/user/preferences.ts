import { Response } from "express";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Preference } from "../../entities/preference";
import { PreferenceRules } from "../../lib/validator-rules";
import { IValidationErrorResponse } from "../../types/contracts";
import {
    ICreatePreferencesRequest,
    ICreatePreferencesResponse,
    IGetPreferencesResponse,
    IUpdatePreferencesRequest,
    IUpdatePreferencesResponse,
} from "../../types/contracts/user/preferences";
import { UserLevel } from "../../types/entities";
import { Authenticator, IRequest, IRequestResult, Validator } from "../index";

export class PreferencesController {
    private dbConn: Connection;

    constructor(dbConn: Connection) {
        this.dbConn = dbConn;
    }

    @Authenticator<null, IGetPreferencesResponse | IValidationErrorResponse>(UserLevel.Regular)
    public async getPreferences(
        req: IRequest<null>,
        _res: Response,
    ): Promise<IRequestResult<IGetPreferencesResponse | IValidationErrorResponse>> {
        const user = req.user!;
        const preference = await this.dbConn.getRepository(Preference).findOne({ where: { user: { id: user.id } } });

        if (typeof preference === "undefined") {
            return {
                data: { notFound: "Not Found" },
                status: HTTPStatus.NOT_FOUND,
            };
        }

        return {
            data: { preference: preference.toJson() },
            status: HTTPStatus.OK,
        };
    }

    @Authenticator<ICreatePreferencesRequest, ICreatePreferencesResponse | IValidationErrorResponse>(UserLevel.Regular)
    @Validator<ICreatePreferencesRequest, ICreatePreferencesResponse>(PreferenceRules)
    public async createPreferences(
        req: IRequest<ICreatePreferencesRequest>,
        _res: Response,
    ): Promise<IRequestResult<ICreatePreferencesResponse | IValidationErrorResponse>> {
        const user = req.user!;
        const hasPreference: boolean = await (async () => {
            const foundPreference = await this.dbConn
                .getRepository(Preference)
                .findOne({ where: { user: { id: user.id } } });
            return typeof foundPreference !== "undefined";
        })();
        if (hasPreference) {
            return {
                data: { error: "User already has preferences." },
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        const preference = new Preference();
        preference.user = user;
        preference.currentRealm = req.body.current_realm;
        preference.currentRegion = req.body.current_region;
        await this.dbConn.manager.save(preference);

        return {
            data: { preference: preference.toJson() },
            status: HTTPStatus.CREATED,
        };
    }

    @Authenticator<IUpdatePreferencesRequest, IUpdatePreferencesResponse | IValidationErrorResponse>(UserLevel.Regular)
    @Validator<IUpdatePreferencesRequest, IUpdatePreferencesResponse>(PreferenceRules)
    public async updatePreferences(
        req: IRequest<IUpdatePreferencesRequest>,
        _res: Response,
    ): Promise<IRequestResult<IUpdatePreferencesResponse | IValidationErrorResponse>> {
        const user = req.user!;
        const preference = await this.dbConn.getRepository(Preference).findOne({ where: { user: { id: user.id } } });

        if (typeof preference === "undefined") {
            return {
                data: { notFound: "Not Found" },
                status: HTTPStatus.NOT_FOUND,
            };
        }

        preference.currentRealm = req.body.current_realm;
        preference.currentRegion = req.body.current_region;
        await this.dbConn.manager.save(preference);
        return {
            data: { preference: preference.toJson() },
            status: HTTPStatus.OK,
        };
    }
}
