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

const voiceProfileValidator = v.object({
  summary: v.string(),
  rules: v.array(v.string()),
});

export const generateCommitVariants = internalAction({
  args: {
    commitMessage: v.string(),
    voiceProfile: v.optional(voiceProfileValidator),
  },
  returns: v.array(v.string()),
  handler: async (_ctx, args) => {
    return await generateVariantsForCommitMessage({
      commitMessage: args.commitMessage,
      voiceProfile: args.voiceProfile,
    });
  },
});

export const populateDraftVariants = internalAction({
  args: {
    draftId: v.id("drafts"),
    commitMessage: v.string(),
    voiceProfile: v.optional(voiceProfileValidator),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const variants = await generateVariantsForCommitMessage({
      commitMessage: args.commitMessage,
      voiceProfile: args.voiceProfile,
    });

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

async function generateVariantsForCommitMessage({
  commitMessage,
  voiceProfile,
}: {
  commitMessage: string;
  voiceProfile?: { summary: string; rules: string[] };
}) {
  const prompt = buildCommitVariantPrompt({
    commitMessage,
    voiceProfile,
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
