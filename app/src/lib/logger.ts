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

    return createLogger({
        format: format.json(),
        level: settings.level,
        transports: [
            new transports.Console({ level: settings.level }),
            new transports.File({ filename: "app.log", level: settings.level }),
        ],
    });
};
