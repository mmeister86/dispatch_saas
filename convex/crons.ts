import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh X post analytics",
  { minutes: 15 },
  internal.analytics.refreshDuePostMetrics,
  {},
);

export default crons;
