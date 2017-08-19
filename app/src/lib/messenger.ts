import * as nats from "nats";

const DEFAULT_TIMEOUT = 2.5 * 1000;

enum subjects {
  status = "status",
  regions = "regions"
}

export enum code {
  ok = "1",
  not_found = "-1"
}

export class Message {
  error: Error | null;
  data: object | null;
  code: code;

  constructor(msg: IMessage) {
    this.error = null;
    if (msg.error.length > 0) {
      this.error = new Error(msg.error);
    }

    this.data = null;
    if (msg.data.length > 0) {
      this.data = JSON.parse(msg.data);
    }
    this.code = code[msg.code.toString()];
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

  request(subject: string, body?: string): Promise<Message> {
    return new Promise<Message>((resolve, reject) => {
      const tId = setTimeout(() => reject(new Error("Timed out!")), DEFAULT_TIMEOUT);

      if (!body) {
        body = "";
      }

      this.client.request(subject, body, (natsMsg: string) => {
        clearTimeout(tId);

        const parsedMsg: IMessage = JSON.parse(natsMsg);
        const msg = new Message(parsedMsg);
        if (msg.error) {
          reject(msg.error);

          return;
        }

        resolve(msg);
      });
    });
  }

  getStatus(regionName: string): Promise<Message> {
    return this.request(subjects.status, JSON.stringify({ region_name: regionName }));
  }

  getRegions(): Promise<Message> {
    return this.request(subjects.regions);
  }
}
