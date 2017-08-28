import { Logger, LoggerInstance, transports } from "winston";

export default (): LoggerInstance => {
  return new Logger({ transports: [new transports.Console()] });
};