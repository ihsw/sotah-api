import * as nats from "nats";

const DEFAULT_TIMEOUT = 2.5 * 1000;

enum subjects {
  status = "status"
}

export default class {
  client: nats.Client;

  constructor(client: nats.Client) {
    this.client = client;
  }

  request(subject: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const tId = setTimeout(() => reject("Timed out!"), DEFAULT_TIMEOUT);
      this.client.request(subject, (msg) => {
        clearTimeout(tId);

        resolve(msg);
      });
    });
  }

  async getStatus(): Promise<string> {
    return this.request(subjects.status);
  }
}
