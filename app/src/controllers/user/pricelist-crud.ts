import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Pricelist, PricelistEntry } from "../../entities";
import { Messenger } from "../../lib/messenger";
import { PricelistRequestBodyRules } from "../../lib/validator-rules";
import { ItemId } from "../../types/item";
import { IValidationErrorResponse } from "../contracts";
import {
    ICreatePricelistRequest,
    ICreatePricelistResponse,
    IGetPricelistResponse,
    IGetPricelistsResponse,
    IUpdatePricelistRequest,
    IUpdatePricelistResponse,
} from "../contracts/user/pricelist-crud";
import { RequestHandler } from "../index";

export class PricelistCrudController {
    private dbConn: Connection;
    private messenger: Messenger;

    constructor(dbConn: Connection, messenger: Messenger) {
        this.dbConn = dbConn;
        this.messenger = messenger;
    }

    public createPricelist: RequestHandler<
        ICreatePricelistRequest,
        ICreatePricelistResponse | IValidationErrorResponse
    > = async req => {
        const user = req.user!;
        let result: ICreatePricelistRequest | null = null;
        try {
            result = (await PricelistRequestBodyRules.validate(req.body)) as ICreatePricelistRequest;
        } catch (err) {
            const validationErrorResponse: IValidationErrorResponse = err.errors;
            return {
                data: validationErrorResponse,
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
        return {
            data: { entries: entries.map(v => v.toJson()), pricelist: pricelist.toJson() },
            status: HTTPStatus.CREATED,
        };
    };

    public getPricelists: RequestHandler<null, IGetPricelistsResponse> = async req => {
        const user = req.user!;

        // gathering pricelists associated with this user
        let pricelists = await this.dbConn.getRepository(Pricelist).find({
            where: { user: { id: user.id } },
        });

        // filtering out profession-pricelists
        pricelists = pricelists.filter(v => typeof v.professionPricelist === "undefined");

        // gathering related items
        const itemIds: ItemId[] = pricelists.reduce((pricelistsItemIds: ItemId[], pricelist) => {
            return pricelist.entries!.reduce((entriesItemIds: ItemId[], entry) => {
                if (entriesItemIds.indexOf(entry.itemId) === -1) {
                    entriesItemIds.push(entry.itemId);
                }

                return entriesItemIds;
            }, pricelistsItemIds);
        }, []);
        const items = (await this.messenger.getItems(itemIds)).data!.items;

        // dumping out a response
        return {
            data: { pricelists: pricelists.map(v => v.toJson()), items },
            status: HTTPStatus.OK,
        };
    };

    public getPricelist: RequestHandler<null, IGetPricelistResponse | null> = async req => {
        const user = req.user!;
        const pricelist = await this.dbConn.manager.getRepository(Pricelist).findOne({
            where: { id: req.params["id"], user: { id: user.id } },
        });
        if (typeof pricelist === "undefined") {
            return {
                data: null,
                status: HTTPStatus.NOT_FOUND,
            };
        }

        return {
            data: { pricelist: pricelist.toJson() },
            status: HTTPStatus.OK,
        };
    };

    public updatePricelist: RequestHandler<
        IUpdatePricelistRequest,
        IUpdatePricelistResponse | IValidationErrorResponse | null
    > = async req => {
        // resolving the pricelist
        const user = req.user!;
        const pricelist = await this.dbConn.getRepository(Pricelist).findOne({
            where: { id: req.params["id"], user: { id: user.id } },
        });
        if (typeof pricelist === "undefined") {
            return {
                data: null,
                status: HTTPStatus.NOT_FOUND,
            };
        }

        // validating the request body
        let result: IUpdatePricelistRequest | null = null;
        try {
            result = (await PricelistRequestBodyRules.validate(req.body)) as IUpdatePricelistRequest;
        } catch (err) {
            const validationErrorResponse: IValidationErrorResponse = err.errors;

            return {
                data: validationErrorResponse,
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        // saving the pricelist
        pricelist.name = result.pricelist.name;
        await this.dbConn.manager.save(pricelist);

        // misc
        const entries = pricelist.entries!;

        // creating new entries
        const newRequestEntries = result.entries.filter(v => !!v.id === false);
        const newEntries = await Promise.all(
            newRequestEntries.map(v => {
                const entry = new PricelistEntry();
                entry.pricelist = pricelist;
                entry.itemId = v.item_id;
                entry.quantityModifier = v.quantity_modifier;

                return this.dbConn.manager.save(entry);
            }),
        );

        // updating existing entries
        const receivedRequestEntries = result.entries.filter(v => typeof v.id !== "undefined");
        let receivedEntries = await this.dbConn
            .getRepository(PricelistEntry)
            .createQueryBuilder("entries")
            .whereInIds(receivedRequestEntries.map(v => v.id))
            .getMany();
        receivedEntries = await Promise.all(
            receivedEntries.map((v, i) => {
                v.itemId = receivedRequestEntries[i].item_id;
                v.quantityModifier = receivedRequestEntries[i].quantity_modifier;

                return this.dbConn.manager.save(v);
            }),
        );

        // gathering removed entries and deleting them
        const receivedEntryIds = receivedEntries.map(v => v.id);
        const removedEntries = entries.filter(v => receivedEntryIds.indexOf(v.id) === -1);
        await Promise.all(removedEntries.map(v => this.dbConn.manager.remove(v)));

        // dumping out a response
        return {
            data: {
                entries: [...receivedEntries, ...newEntries].map(v => v.toJson()),
                pricelist: pricelist.toJson(),
            },
            status: HTTPStatus.OK,
        };
    };

    public deletePricelist: RequestHandler<null, null> = async req => {
        // resolving the pricelist
        const user = req.user!;
        const pricelist = await this.dbConn.getRepository(Pricelist).findOne({
            where: { id: req.params["id"], user: { id: user.id } },
        });
        if (typeof pricelist === "undefined") {
            return {
                data: null,
                status: HTTPStatus.NOT_FOUND,
            };
        }

        await Promise.all(pricelist.entries!.map(v => this.dbConn.manager.remove(v)));
        await this.dbConn.manager.remove(pricelist);

        return {
            data: null,
            status: HTTPStatus.OK,
        };
    };
}
