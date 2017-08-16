import * as nats from "nats";

const DEFAULT_TIMEOUT = 2.5 * 1000;

enum subjects {
  status = "status"
}

export interface message {
  data: string;
  error: string;
}

export default class {
  client: nats.Client;

  constructor(client: nats.Client) {
    this.client = client;
  }

  request(subject: string, body: string): Promise<message> {
    return new Promise<message>((resolve, reject) => {
      const tId = setTimeout(() => reject("Timed out!"), DEFAULT_TIMEOUT);
      this.client.request(subject, body, (msg: string) => {
        clearTimeout(tId);

        const parsedMsg: message = JSON.parse(msg);
        if (parsedMsg.error.length > 0) {
          reject(new Error(parsedMsg.error));

          return;
        }

        resolve(parsedMsg);
      });
    });
  }

  async getStatus(regionName: string): Promise<message> {
    return this.request(subjects.status, JSON.stringify({ regionName: regionName }));
  }
}
