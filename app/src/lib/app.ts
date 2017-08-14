import * as express from "express";
import * as nats from "nats";

export default (natsConnection: nats.Client): express.Express => {
    const app = express();

    app.get("/", (_, res) => res.send("Hello, world!"));
    app.get("/status", (_, res) => {
        natsConnection.request("status", (natsMsg) => {
            res.send(natsMsg);
        });
    });

    return app;
};
