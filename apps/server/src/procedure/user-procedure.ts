import { templateRequiredField, templates, user } from "@/db/schema/auth";
import { protectedProcedure } from "../lib/trpc";
import z from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { encryptToken } from "@/helper";
import { Payload, UserIjazah } from "@/types";

export default function UserProcedure() {
  return {
    getUsers: protectedProcedure.input(
      z.object({
        tamplate: z.string()
      })
    ).query(async ({ ctx, input }) => {
      const resultTemplate = (await ctx.db.select().from(templates).where(eq(templates.name, input.tamplate)));
      if (!resultTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        })
      }

      const template = resultTemplate[0];
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        })
      }

      // Get required field tempalte
      const requiredTemplateResult = (await ctx.db.select().from(templateRequiredField).where(eq(templateRequiredField.templateId, template.id)));
      if (!requiredTemplateResult) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        })
      }

      let response: UserIjazah[] = [];
      const result = await ctx.db.select().from(user);

      for (const user of result) {
        const dataPayload: Payload = {
          templateId: template.id,
          name: requiredTemplateResult.map((item) => item.name),
          value: requiredTemplateResult.map((item) => (user.id)),
          exp: 0,
        }

        const token = encryptToken(dataPayload, parseInt(template.expiredTime));

        const urlIjazah = `/pdf/${user.id}?q=${token}`;
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
  };
}
