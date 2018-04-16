import * as zlib from "zlib";
import * as nats from "nats";
import { LoggerInstance } from "winston";

import { regionName, IRegion, IStatus } from "./region";
import { realmSlug } from "./realm";
import { IAuctions } from "./auction";

const DEFAULT_TIMEOUT = 30 * 1000;

export const gunzip = (data: Buffer): Promise<Buffer> => {
  return new Promise<Buffer>((reslove, reject) => {
    zlib.gunzip(data, (err, result) => {
      if (err) {
        reject(err);

        return;
      }

      reslove(result);
    });
  });
};

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
  data: T | null;
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

export class Messenger {
  client: nats.Client;
  logger: LoggerInstance;

  constructor(client: nats.Client, logger: LoggerInstance) {
    this.client = client;
    this.logger = logger;
  }

  request<T>(subject: string, body?: string): Promise<Message<T>> {
    return new Promise<Message<T>>((resolve, reject) => {
      const tId = setTimeout(() => reject(new Error("Timed out!")), DEFAULT_TIMEOUT);

      if (!body) {
        body = "";
      }

      this.logger.debug("Sending messenger request", { subject, body });
      this.client.request(subject, body, (natsMsg: string) => {
        (async () => {
          clearTimeout(tId);
          const parsedMsg: IMessage = JSON.parse(natsMsg.toString());
          const msg = new Message<T>(parsedMsg);
          if (msg.error !== null && msg.code === code.genericError) {
            reject(new MessageError(msg.error.message, msg.code));

            return;
          }

          resolve(msg);
        })();
      });
    });
  }

  getStatus(regionName: regionName): Promise<Message<IStatus>> {
    return this.request(subjects.status, JSON.stringify({ region_name: regionName }));
  }

  getRegions(): Promise<Message<IRegion[]>> {
    return this.request(subjects.regions);
  }

  async getAuctions(regionName: regionName, realmSlug: realmSlug): Promise<Message<IAuctions>> {
    const message = await this.request<string>(
      subjects.auctions,
      JSON.stringify({ region_name: regionName, realm_slug: realmSlug })
    );
    if (message.code !== code.ok) {
      return { code: message.code, data: null, error: message.error };
    }

    return {
      code: code.ok,
      data: JSON.parse((await gunzip(Buffer.from(message.data!, "base64"))).toString()),
      error: null,
    };
  }
}
