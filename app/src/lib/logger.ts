import { Logger, LoggerInstance, NPMLoggingLevel, transports } from "winston";

export const getLogger = (level: NPMLoggingLevel = "warn"): LoggerInstance => {
    return new Logger({ transports: [new transports.Console({ level })] });
};
