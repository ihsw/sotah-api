export interface IPubsubMessage {
    data: string; // base-64 encode bytes
    attributes: {
        [key: string]: string;
    };
    messageId: string;
    publishTime: string; // formatted 9999-12-31T23:59:59.999999999Z
}
