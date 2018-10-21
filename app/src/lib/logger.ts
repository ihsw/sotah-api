import { createLogger, format, Logger, transports } from "winston";

export const getLogger = (level: string = "warn"): Logger => {
    return createLogger({
        format: format.json(),
        level,
        transports: [new transports.Console({ level })],
    });
};
