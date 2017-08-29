import * as nats from "nats";

import { regionName, IRegion, IStatus } from "./region";
import { realmSlug } from "./realm";
import { IAuctions } from "./auction";

const DEFAULT_TIMEOUT = 2.5 * 1000;

export enum subjects {
  status = "status",
  regions = "regions",
  genericTestErrors = "genericTestErrors",
  auctions = "auctions"
}

export enum code {
  ok = 1,
  genericError = -1,
  msgJsonParseError = -2,
  notFound = -3
}

export class MessageError {
  message: string;
  code: code;

  constructor(message: string, code: code) {
    this.message = message;
    this.code = code;
  }
}

export class Message<T> {
  error: Error | null;
  data: T;
  code: code;

  constructor(msg: IMessage) {
    this.error = null;
    if (msg.error.length > 0) {
      this.error = new Error(msg.error);
    }

    this.data = <T>{};
    if (msg.data.length > 0) {
      this.data = JSON.parse(msg.data);
    }

    this.code = msg.code;
  }
}

interface IMessage {
  data: string;
  error: string;
  code: number;
}

export default class {
  client: nats.Client;

  constructor(client: nats.Client) {
    this.client = client;
  }

  request<T>(subject: string, body?: string): Promise<Message<T>> {
    return new Promise<Message<T>>((resolve, reject) => {
      const tId = setTimeout(() => reject(new Error("Timed out!")), DEFAULT_TIMEOUT);

      if (!body) {
        body = "";
      }

      this.client.request(subject, body, (natsMsg: string) => {
        clearTimeout(tId);

        const parsedMsg: IMessage = JSON.parse(natsMsg);
        const msg = new Message<T>(parsedMsg);
        if (msg.error !== null && msg.code === code.genericError) {
          reject(new MessageError(msg.error.message, msg.code));

          return;
        }

        resolve(msg);
      });
    });
  }

  getStatus(regionName: regionName): Promise<Message<IStatus>> {
    return this.request(subjects.status, JSON.stringify({ region_name: regionName }));
  }

  getRegions(): Promise<Message<IRegion[]>> {
    return this.request(subjects.regions);
  }

  getAuctions(regionName: regionName, realmSlug: realmSlug): Promise<Message<IAuctions>> {
    return this.request(
      subjects.auctions,
      JSON.stringify({ region_name: regionName, realm_slug: realmSlug })
    );
  }
}
