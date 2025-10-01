import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { UserProcedure, TemplatePdfProcedure } from "@/procedure";


export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session?.user,
    };
  }),
  ...UserProcedure(),
  ...TemplatePdfProcedure()
});

export type AppRouter = typeof appRouter;
