import { RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  generateDraftVariants: {
    kind: "token bucket",
    rate: 3,
    period: 60_000,
    capacity: 3,
  },
  postDraftToX: {
    kind: "fixed window",
    rate: 1,
    period: 10_000,
  },
});
