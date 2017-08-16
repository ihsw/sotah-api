import * as nats from "nats";

import { IRegion } from "./region";

const DEFAULT_TIMEOUT = 2.5 * 1000;

enum subjects {
  status = "status",
  regions = "regions"
}

export interface IMessage {
  data: string;
  error: string;
}

export default class {
  client: nats.Client;

  constructor(client: nats.Client) {
    this.client = client;
  }

  request(subject: string, body?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const tId = setTimeout(() => reject(new Error("Timed out!")), DEFAULT_TIMEOUT);

      if (!body) {
        body = "";
      }

      this.client.request(subject, body, (msg: string) => {
        clearTimeout(tId);

        const parsedMsg: IMessage = JSON.parse(msg);
        if (parsedMsg.error.length > 0) {
          reject(new Error(parsedMsg.error));

          return;
        }

        resolve(parsedMsg.data);
      });
    });
  }

  async getStatus(regionName: string): Promise<string> {
    return this.request(subjects.status, JSON.stringify({ region_name: regionName }));
  }

  async getRegions(): Promise<IRegion[]> {
    return JSON.parse(await this.request(subjects.regions));
  }
}
