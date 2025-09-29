import { templateRequiredField, templates, user } from "@/db/schema/auth";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import z from "zod";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { Payload, UserIjazah } from "@/types";
import { encryptToken } from "@/helper";

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
  getUsers: protectedProcedure.input(
    z.object({
      tamplate: z.string()
    })
  ).query(async ({ ctx, input }) => {

    // Get template
    const resultTemplate = (await ctx.db.select().from(templates).where(eq(templates.name, input.tamplate)));
    if (!resultTemplate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Template not found",
      })
    }
    const template = resultTemplate[0];
    if (!template) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Template not found",
      })
    }

    // Get required field tempalte
    const requiredTemplateResult = (await ctx.db.select().from(templateRequiredField).where(eq(templateRequiredField.templateId, template.id)));
   

    let response: UserIjazah[] = [];
    const result = await ctx.db.select().from(user);

    for (const user of result) {
      const dataPayload:Payload = {
        templateId: template.id,
        name : requiredTemplateResult.map((item) => item.name),
        value : requiredTemplateResult.map((item) => (user.id)),
        exp: 0,
      }
      
      const token = encryptToken(dataPayload);

      const urlIjazah = `${process.env.FE_URL}/viewer/${token}`;
      response.push({
        id: user.id,
        name: user.name,
        email: user.email,
        urlIjazah,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    }

    return response;
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
      name: z.string(),
      template: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {

      const id = crypto.randomUUID();
      const data = {
        id,
        template: input.template,
        name: input.name,
      };
      await ctx.db.transaction(async (tx) => {
        const result = await tx
          .insert(templates)
          .values(data)
          .onDuplicateKeyUpdate({
            set: {
              template: input.template,
              name: input.name,
              updatedAt: new Date(),
            },
          });

        if (result[0].affectedRows != 2) {
          await tx
            .insert(templateRequiredField)
            .values({
              id,
              templateId: id,
              name: "name",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onDuplicateKeyUpdate({
              set: { id: sql`id` },
            });
        }
      });

      return { success: true };
    }),

});

export type AppRouter = typeof appRouter;
