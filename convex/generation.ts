import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { v } from "convex/values";
import { env, internalAction } from "./_generated/server";
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
    const prompt = buildCommitVariantPrompt({
      commitMessage: args.commitMessage,
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
  },
});
