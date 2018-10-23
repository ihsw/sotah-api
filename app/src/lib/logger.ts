import { createLogger, format, Logger, transports } from "winston";

export const getLogger = (level: string = "info"): Logger => {
    return createLogger({
        format: format.json(),
        level,
        transports: [new transports.Console({ level }), new transports.File({ filename: "app.log", level })],
    });
};
