import pino from "pino";
import { getReqId } from "./request-context";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  serializers: {
    req: (r: any) => ({ method: r.method, url: r.url }),
    err: pino.stdSerializers.err,
  },
});

export function createLogger(context: string) {
  const child = logger.child({ context });

  function inject(obj: any, msg?: string): [any, string?] {
    const reqId = getReqId();
    if (reqId !== "no-req-id" && obj && typeof obj === "object" && !obj.reqId) {
      return [{ ...obj, reqId }, msg];
    }
    return [obj, msg];
  }

  return {
    info: (obj: any, msg?: string) => child.info(...inject(obj, msg)),
    warn: (obj: any, msg?: string) => child.warn(...inject(obj, msg)),
    error: (obj: any, msg?: string) => child.error(...inject(obj, msg)),
    debug: (obj: any, msg?: string) => child.debug(...inject(obj, msg)),
    fatal: (obj: any, msg?: string) => child.fatal(...inject(obj, msg)),
    trace: (obj: any, msg?: string) => child.trace(...inject(obj, msg)),
    child: (bindings: pino.Bindings) =>
      createLogger(`${context}:${bindings.context || ""}`),
  };
}

export default logger;
