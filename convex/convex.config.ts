import { defineApp } from "convex/server";
import { v } from "convex/values";
import resend from "@convex-dev/resend/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

const app = defineApp({
  env: {
    LEMONSQUEEZY_API_KEY: v.string(),
    LEMONSQUEEZY_STORE_ID: v.string(),
    LEMONSQUEEZY_GOOD_VARIANT_ID: v.string(),
    LEMONSQUEEZY_BETTER_VARIANT_ID: v.string(),
    LEMONSQUEEZY_WEBHOOK_SECRET: v.string(),
    APP_URL: v.string(),
    GITHUB_APP_ID: v.string(),
    GITHUB_APP_PRIVATE_KEY: v.string(),
    GITHUB_APP_INSTALL_URL: v.string(),
    GITHUB_WEBHOOK_SECRET: v.string(),
    OPENAI_API_KEY: v.string(),
    AI_MODEL: v.string(),
    X_CLIENT_ID: v.string(),
    X_CLIENT_SECRET: v.string(),
    X_OAUTH_REDIRECT_URI: v.string(),
  },
});
app.use(resend);
app.use(rateLimiter);

export default app;
