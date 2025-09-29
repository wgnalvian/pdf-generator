import { templateRequiredField, templateSessions, templates, user } from "@/db/schema/auth";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import z from "zod";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { Payload, UserIjazah, UserPreview } from "@/types";
import { encryptToken, decryptToken } from "@/helper";

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
  saveTemplate: protectedProcedure
    .input(z.object({
      name: z.string(),
      template: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {

      let id = crypto.randomUUID().toString();
      const data = {
        id,
        template: input.template,
        name: input.name,
        password: "1234",
        maxCountHit: 3,
        expiredTime: "3600",
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

        console.log("AFFECTED ROWS", result[0].affectedRows);

        const isUpdate = result[0].affectedRows == 2;

        if (isUpdate) {
          const resultTemplate = (await tx.select().from(templates).where(eq(templates.name, input.name)));
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

          id = template.id;
          // Delete required field
          await tx.delete(templateRequiredField).where(eq(templateRequiredField.templateId, id));
        }

        const requiredFields = ['userId'];

        for (const requiredField of requiredFields) {
          const idReqField = crypto.randomUUID();
          await tx
            .insert(templateRequiredField)
            .values({
              id: idReqField,
              templateId: id,
              name: requiredField,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
        }

      });

      return { success: true };
    }),
  getUserByKey: protectedProcedure
    .input(z.object({
      key: z.string(),
    })).query(async ({ ctx, input }) => {
      let decoded = decryptToken(input.key);


      // Insert into template sessions
      await ctx.db.insert(templateSessions).values({
        id: crypto.randomUUID(),
        token: input.key,
        userId: ctx.session?.user.id ?? ""
      })

      // Get count template session
      const countTemplateSession = (await ctx.db.select().from(templateSessions).where(eq(templateSessions.token, input.key)));

      // Get template
      const resultTemplate = (await ctx.db.select().from(templates).where(eq(templates.id, decoded.templateId)));
      if (resultTemplate.length == 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        })
      }

      const template = resultTemplate[0];
      // Validate max hit count 
      if (template.maxCountHit < countTemplateSession.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have reached the maximum number of hits",
        })
      }

      // Convert 

      const response: UserPreview = {
        id: ctx.session?.user.id ?? "",
        name: ctx.session?.user.name ?? "",
        email: ctx.session?.user.email ?? "",
        isHavePassword: template.password ? true : false,
        exp: new Date(decoded.exp * 1000),
        createdAt: ctx.session?.user.createdAt ?? new Date(),
        updatedAt: ctx.session?.user.updatedAt ?? new Date(),
      }

      return response
    }),
  validatePasswordByKey: protectedProcedure
    .input(z.object({
      password: z.string(),
      key: z.string(),
    })).mutation(async ({ ctx, input }) => {
      let decoded = decryptToken(input.key);


      // Insert into template sessions
      await ctx.db.insert(templateSessions).values({
        id: crypto.randomUUID(),
        token: input.key,
        userId: ctx.session?.user.id ?? ""
      })

      // Get count template session
      const countTemplateSession = (await ctx.db.select().from(templateSessions).where(eq(templateSessions.token, input.key)));

      // Get template
      const resultTemplate = (await ctx.db.select().from(templates).where(eq(templates.id, decoded.templateId)));
      if (resultTemplate.length == 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        })
      }

      const template = resultTemplate[0];

      if (input.password != template.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Password not match",
        })
      }

      // Convert 
      const response: UserPreview = {
        id: ctx.session?.user.id ?? "",
        name: ctx.session?.user.name ?? "",
        email: ctx.session?.user.email ?? "",
        isHavePassword: template.password ? true : false,
        exp: new Date(decoded.exp * 1000),
        createdAt: ctx.session?.user.createdAt ?? new Date(),
        updatedAt: ctx.session?.user.updatedAt ?? new Date(),
      }

      return response
    }),
  getIsValidView: protectedProcedure
    .input(z.object({ token: z.string(), idUser: z.string() }))
    .query(async ({ ctx, input }) => {
      const object: Payload = decryptToken(input.token);
      const fieldObject = object.name;
      const valueObject = object.value;

      const setField = new Set(fieldObject.map(String));

      const result = await ctx.db
        .select()
        .from(templateRequiredField)
        .where(eq(templateRequiredField.templateId, object.templateId));

      // validation result on table
      const matchedField = result.filter(r => setField.has(r.name));
      const matchedValue = valueObject.filter(r => r == input.idUser);

      const isValid = matchedField.length > 0 && matchedValue.length > 0;

      // Get template
      const resultTemplate = (await ctx.db.select().from(templates).where(eq(templates.id, object.templateId)));
      if (resultTemplate.length == 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        })
      }

      const template = resultTemplate[0];

      // Insert into template sessions
      await ctx.db.insert(templateSessions).values({
        id: crypto.randomUUID(),
        token: input.token,
        userId: ctx.session?.user.id ?? ""
      })

      // Get count template session
      const countTemplateSession = (await ctx.db.select().from(templateSessions).where(eq(templateSessions.token, input.token)));

      // Validate max hit count 
      if (template.maxCountHit < countTemplateSession.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have reached the maximum number of hits",
        })
      }

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your token is invalid",
        })
      }

      // Convert 
      const response: UserPreview = {
        id: ctx.session?.user.id ?? "",
        name: ctx.session?.user.name ?? "",
        email: ctx.session?.user.email ?? "",
        isHavePassword: template.password ? true : false,
        exp: new Date(object.exp * 1000),
        createdAt: ctx.session?.user.createdAt ?? new Date(),
        updatedAt: ctx.session?.user.updatedAt ?? new Date(),
      }

      return response
    }),
});

export type AppRouter = typeof appRouter;
