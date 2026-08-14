import type { Logger } from "pino";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      log?: Logger;
    }
  }
}

export {};