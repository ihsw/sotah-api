import { code } from "./index";

export class MessageError {
    public message: string;
    public code: code;

    constructor() {
        this.message = "";
        this.code = code.genericError;
    }
}
