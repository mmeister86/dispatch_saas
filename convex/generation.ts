import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { env, internalAction, internalMutation } from "./_generated/server";
import {
  buildCommitVariantPrompt,
  validateGeneratedVariants,
} from "./generationCore";

const variantsSchema = z.object({
  variants: z.array(z.string()).min(2).max(3),
});

export const generateCommitVariants = internalAction({
  args: {
    commitMessage: v.string(),
  },
  returns: v.array(v.string()),
  handler: async (_ctx, args) => {
    return await generateVariantsForCommitMessage(args.commitMessage);
  },
});

export const populateDraftVariants = internalAction({
  args: {
    draftId: v.id("drafts"),
    commitMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const variants = await generateVariantsForCommitMessage(args.commitMessage);

    await ctx.runMutation(internal.generation.updateDraftVariants, {
      draftId: args.draftId,
      variants,
    });

    return null;
  },
});

export const updateDraftVariants = internalMutation({
  args: {
    draftId: v.id("drafts"),
    variants: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.draftId, {
      variants: args.variants,
    });
    return null;
  },
});

async function generateVariantsForCommitMessage(commitMessage: string) {
  const prompt = buildCommitVariantPrompt({
    commitMessage,
  });
  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const result = await generateObject({
    model: openai(env.AI_MODEL),
    schema: variantsSchema,
    system: prompt.system,
    prompt: prompt.prompt,
  });

  return validateGeneratedVariants(result.object.variants);
}
