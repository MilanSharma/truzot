import { AsyncLocalStorage } from "async_hooks";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export interface RequestContext {
  reqId: string;
  startTime: number;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(fn: () => T): T {
  const ctx: RequestContext = {
    reqId: randomBytes(8).toString("hex"),
    startTime: Date.now(),
  };
  return storage.run(ctx, fn);
}

export function getContext(): RequestContext {
  const ctx = storage.getStore();
  return ctx ?? { reqId: "no-req-id", startTime: Date.now() };
}

export function getReqId(): string {
  return getContext().reqId;
}

type NextHandler = (req: Request, ...args: any[]) => Promise<NextResponse>;

export function withContext(handler: NextHandler): NextHandler {
  return async (req, ...args) => runWithContext(() => handler(req, ...args));
}
