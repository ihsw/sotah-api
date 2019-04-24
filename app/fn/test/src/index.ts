import { IPubsubMessage } from "@sotah/api/src/fn";

export const test = (data: IPubsubMessage, _context: unknown) => {
    // tslint:disable-next-line:no-console
    console.log("Hello, world!", data);
};
