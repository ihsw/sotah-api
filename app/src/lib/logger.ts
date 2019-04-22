import { LoggingWinston } from "@google-cloud/logging-winston";
import { createLogger, format, Logger, transports } from "winston";

interface ILoggerOptions {
    level: string;
    isGceEnv: boolean;
}

const defaultLoggerOptions: ILoggerOptions = { level: "warn", isGceEnv: false };

export const getLogger = (opts?: ILoggerOptions): Logger => {
    const settings: ILoggerOptions = (() => {
        if (typeof opts === "undefined") {
            return { ...defaultLoggerOptions };
        }

        return { ...defaultLoggerOptions, ...opts };
    })();
    const { level, isGceEnv } = settings;

    const loggerTransports = (() => {
        if (!isGceEnv) {
            return [new transports.Console({ level }), new transports.File({ filename: "app.log", level })];
        }

        return [new transports.Console({ level }), new LoggingWinston({ level })];
    })();

    return createLogger({
        format: format.json(),
        level: settings.level,
        transports: loggerTransports,
    });
};
