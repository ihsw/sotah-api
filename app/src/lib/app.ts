import * as express from "express";

export default (): express.Express => {
    const app = express();

    app.get("/", (_, res) => res.send("Hello, world!"));

    return app;
};
