import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Pricelist, PricelistEntry, ProfessionPricelist } from "../../entities";
import { UserLevel } from "../../entities/user";
import { ProfessionPricelistRequestBodyRules } from "../../lib/validator-rules";
import { IValidationErrorResponse } from "../contracts";
import {
    ICreateProfessionPricelistRequest,
    ICreateProfessionPricelistResponse,
} from "../contracts/user/profession-pricelists-crud";
import { RequestHandler } from "../index";

export class ProfessionPricelistsCrudController {
    private dbConn: Connection;

    constructor(dbConn: Connection) {
        this.dbConn = dbConn;
    }

    public createProfessionPricelist: RequestHandler<
        ICreateProfessionPricelistRequest,
        ICreateProfessionPricelistResponse | IValidationErrorResponse
    > = async req => {
        const user = req.user!;
        if (user.level !== UserLevel.Admin) {
            const validationErrors: IValidationErrorResponse = { unauthorized: "You are not authorized to do that." };

            return {
                data: validationErrors,
                status: HTTPStatus.UNAUTHORIZED,
            };
        }

        let result: ICreateProfessionPricelistRequest | null = null;
        try {
            result = (await ProfessionPricelistRequestBodyRules.validate(
                req.body,
            )) as ICreateProfessionPricelistRequest;
        } catch (err) {
            const validationErrors: IValidationErrorResponse = { [err.path]: err.message };

            return {
                data: validationErrors,
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        const pricelist = new Pricelist();
        pricelist.user = user;
        pricelist.name = result.pricelist.name;
        await this.dbConn.manager.save(pricelist);

        const entries = await Promise.all(
            result.entries.map(v => {
                const entry = new PricelistEntry();
                entry.pricelist = pricelist;
                entry.itemId = v.item_id;
                entry.quantityModifier = v.quantity_modifier;

                return this.dbConn.manager.save(entry);
            }),
        );

        const professionPricelist = new ProfessionPricelist();
        professionPricelist.pricelist = pricelist;
        professionPricelist.name = result.profession_name;
        professionPricelist.expansion = result.expansion_name;
        await this.dbConn.manager.save(professionPricelist);

        return {
            data: {
                entries,
                pricelist,
                profession_pricelist: professionPricelist,
            },
            status: HTTPStatus.CREATED,
        };
    };

    public deleteProfessionPricelist: RequestHandler<null, null | IValidationErrorResponse> = async req => {
        const user = req.user!;
        if (user.level !== UserLevel.Admin) {
            const validationErrors: IValidationErrorResponse = { unauthorized: "You are not authorized to do that." };

            return {
                data: validationErrors,
                status: HTTPStatus.UNAUTHORIZED,
            };
        }

        const professionPricelist = await this.dbConn.getRepository(ProfessionPricelist).findOne({
            where: { id: req.params["id"] },
        });
        if (typeof professionPricelist === "undefined") {
            return {
                data: null,
                status: HTTPStatus.NOT_FOUND,
            };
        }

        if (professionPricelist.pricelist!.user!.id !== user.id) {
            return {
                data: null,
                status: HTTPStatus.UNAUTHORIZED,
            };
        }

        await Promise.all(professionPricelist.pricelist!.entries!.map(v => this.dbConn.manager.remove(v)));
        await this.dbConn.manager.remove(professionPricelist);
        await this.dbConn.manager.remove(professionPricelist.pricelist);

        return {
            data: null,
            status: HTTPStatus.OK,
        };
    };
}
