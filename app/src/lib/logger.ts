import { Logger, LoggerInstance, transports, NPMLoggingLevel } from "winston";

export const getLogger = (level: NPMLoggingLevel = "warn"): LoggerInstance => {
  return new Logger({ transports: [new transports.Console({level})] });
};
