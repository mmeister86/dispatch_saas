import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const resend: Resend = new Resend(components.resend, {});

export const sendTestEmail = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await resend.sendEmail(ctx, {
      from: "Dispatch <hello@usedispat.ch>",
      to: "delivered@resend.dev",
      subject: "Dispatch Resend test",
      html: "<p>Dispatch can send email through the Convex Resend component.</p>",
    });

    return null;
  },
});
