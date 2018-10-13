import { code, IMessage } from "./index";

export class Message<T> {
    public error: Error | null;
    public rawData?: string;
    public data?: T;
    public code: code;

    constructor(msg: IMessage, parseData: boolean) {
        this.error = null;
        if (msg.error.length > 0) {
            this.error = new Error(msg.error);
        }

        this.rawData = msg.data;
        if (parseData && msg.data.length > 0) {
            this.data = JSON.parse(msg.data);
        }

        this.code = msg.code;
    }
}
