import * as process from "process";

import { test } from "ava";
import * as nats from "nats";

import Messenger from "../lib/messenger";
import { IRegion } from "../lib/region";

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

  const regions: IRegion[] = (await messenger.getRegions()).data;
  t.true(regions.length > 0);
});
