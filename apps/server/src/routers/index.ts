import { templates, user } from "@/db/schema/auth";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import z from "zod";
import { eq } from "drizzle-orm";

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
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(user);
  }),
  getUserById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, input.id));

      return result[0] ?? null;
    }),
  saveTemplate: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      template: z.any(), // atau lebih ketat pakai zod schema
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(templates)
        .values(input)
        .onDuplicateKeyUpdate({
          set: {
            template: input.template,
            name: input.name,
            updatedAt: new Date(),
          },
        });
      return { success: true };
    }),

});

export type AppRouter = typeof appRouter;
