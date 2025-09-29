import { initTRPC, TRPCError, type TRPCBuilder } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

type RouterFactory = typeof t.router;
type ProcedureBuilder = typeof t.procedure;

export const router: RouterFactory = t.router;


export const publicProcedure: ProcedureBuilder = t.procedure;
export const protectedProcedure : ProcedureBuilder = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
