import * as process from "process";

import { test } from "ava";
import * as nats from "nats";

import { default as Messenger, MessageError, subjects, code } from "../lib/messenger";

interface ISetupSettings {
  messenger: Messenger;
}

const setup = (): ISetupSettings => {
  const messenger = new Messenger(nats.connect({
    url: `nats://${process.env["NATS_HOST"]}:${process.env["NATS_PORT"]}`
  }));

  return { messenger };
};

test("Messenger Should fetch regions", async (t) => {
  const { messenger } = setup();

  const regions = (await messenger.getRegions()).data;
  t.true(regions.length > 0);
});

test("Messenger Should throw error when requesting from generic test errors queue", async (t) => {
  const { messenger } = setup();

  try {
    await messenger.request(subjects.genericTestErrors);
  } catch (err) {
    t.true(err instanceof MessageError);
    t.is(code.genericError, (<MessageError>err).code);

    return;
  }

  t.fail();
});

test("Messenger Should fetch region statuses", async (t) => {
  const { messenger } = setup();

  const regions = (await messenger.getRegions()).data;
  const status = (await messenger.getStatus(regions[0].name)).data;
  t.true(status.realms.length > 0);
});

test("Messenger Should fetch auctions", async (t) => {
  const { messenger } = setup();

  const [reg] = (await messenger.getRegions()).data;
  const { realms } = (await messenger.getStatus(reg.name)).data;
  const auctions = (await messenger.getAuctions(reg.name, realms[0].slug)).data;
  t.true(auctions.auctions.length > 0);
});
