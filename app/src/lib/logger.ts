import { Logger, LoggerInstance, transports } from "winston";

export const getLogger = (): LoggerInstance => {
  return new Logger({ transports: [new transports.Console()] });
};
