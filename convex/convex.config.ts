import { defineApp } from "convex/server";
import { v } from "convex/values";
import resend from "@convex-dev/resend/convex.config.js";

const app = defineApp({
  env: {
    LEMONSQUEEZY_API_KEY: v.string(),
    LEMONSQUEEZY_STORE_ID: v.string(),
    LEMONSQUEEZY_GOOD_VARIANT_ID: v.string(),
    LEMONSQUEEZY_BETTER_VARIANT_ID: v.string(),
    LEMONSQUEEZY_WEBHOOK_SECRET: v.string(),
    APP_URL: v.string(),
  },
});
app.use(resend);

export default app;
