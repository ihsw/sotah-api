import * as process from "process";
import "reflect-metadata";

import { test } from "ava";
import * as nats from "nats";

import { code, Messenger, subjects } from "../lib/messenger";
import { MessageError } from "../lib/messenger/message-error";
import { SortDirection, SortKind } from "../types";

interface ISetupSettings {
    messenger: Messenger;
}

const setup = (): ISetupSettings => {
    const messenger = new Messenger(
        nats.connect({
            url: `nats://${process.env["NATS_HOST"]}:${process.env["NATS_PORT"]}`,
        }),
    );

    return { messenger };
};

test.skip("Messenger Should throw error when requesting from generic test errors queue", async t => {
    const { messenger } = setup();

    try {
        await messenger.request(subjects.genericTestErrors);
    } catch (err) {
        t.true(err instanceof MessageError);
        t.is(code.genericError, (err as MessageError).code);

        return;
    }
});

test.skip("Messenger Should fetch region statuses", async t => {
    const { messenger } = setup();

    const { regions } = (await messenger.getBoot()).data!;
    const status = (await messenger.getStatus(regions[0].name)).data!;
    t.true(status.realms.length > 0);
});

test.skip("Messenger Should fetch auctions", async t => {
    const { messenger } = setup();

    const { regions } = (await messenger.getBoot()).data!;
    const [reg] = regions;
    const { realms } = (await messenger.getStatus(reg.name)).data!;
    const auctions = (await messenger.getAuctions({
        count: 10,
        item_filters: [],
        owner_filters: [],
        page: 0,
        realm_slug: realms[0].slug,
        region_name: reg.name,
        sort_direction: SortDirection.none,
        sort_kind: SortKind.none,
    })).data!;
    t.true(auctions.auctions.length > 0);
});

test.skip("Messenger Should fetch items", async t => {
    const { messenger } = setup();

    const res = (await messenger.queryItems("")).data!;
    t.true(res.items.length > 0);
});
