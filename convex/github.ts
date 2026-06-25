import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  env,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { ActionCtx, QueryCtx } from "./_generated/server";

type Plan = "good" | "better";
type ActiveUserAccess = {
  userId: Id<"users">;
  plan: Plan;
  repoLimit: number;
  githubInstallationId?: string;
};

type RepositoryOption = {
  githubRepoId: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
};

type ConnectedRepository = RepositoryOption & {
  connectedAt: number;
  githubInstallationId: string;
};

type LimitState = {
  plan: Plan;
  repoLimit: number;
  repoCount: number;
  canConnectMore: boolean;
};

type CompleteInstallationResult =
  | (LimitState & {
      kind: "connected";
      repo: ConnectedRepository;
    })
  | (LimitState & {
      kind: "selectionRequired";
      repositories: RepositoryOption[];
    });

type ConnectInstalledRepositoryResult = LimitState & {
  kind: "connected";
  repo: ConnectedRepository;
};

type InstalledRepositoryOptionsResult = LimitState & {
  kind: "selectionRequired";
  installationId: string;
  repositories: RepositoryOption[];
};

const REPO_LIMITS = {
  good: 1,
  better: 5,
} as const;

const repositoryOptionValidator = v.object({
  githubRepoId: v.string(),
  fullName: v.string(),
  private: v.boolean(),
  htmlUrl: v.string(),
});

const connectedRepositoryValidator = v.object({
  githubRepoId: v.string(),
  fullName: v.string(),
  private: v.boolean(),
  htmlUrl: v.string(),
  githubInstallationId: v.string(),
  connectedAt: v.number(),
});

const limitStateValidator = {
  plan: v.union(v.literal("good"), v.literal("better")),
  repoLimit: v.number(),
  repoCount: v.number(),
  canConnectMore: v.boolean(),
} as const;

export const connectedRepos = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      ...limitStateValidator,
      installUrl: v.string(),
      hasGitHubInstallation: v.boolean(),
      repos: v.array(connectedRepositoryValidator),
    }),
  ),
  handler: async (ctx) => {
    const access = await getCurrentActiveUserAccess(ctx);

    if (access === null) {
      return null;
    }

    const repos = await ctx.db
      .query("repos")
      .withIndex("by_userId", (q) => q.eq("userId", access.userId))
      .order("desc")
      .take(REPO_LIMITS.better + 1);

    return {
      plan: access.plan,
      repoLimit: access.repoLimit,
      repoCount: repos.length,
      canConnectMore: repos.length < access.repoLimit,
      installUrl: env.GITHUB_APP_INSTALL_URL,
      hasGitHubInstallation:
        access.githubInstallationId !== undefined ||
        repos.some((repo) => repo.githubInstallationId.length > 0),
      repos: repos.map(repoToConnectedRepository),
    };
  },
});

export const completeInstallation = action({
  args: {
    installationId: v.string(),
  },
  returns: v.union(
    v.object({
      kind: v.literal("connected"),
      ...limitStateValidator,
      repo: connectedRepositoryValidator,
    }),
    v.object({
      kind: v.literal("selectionRequired"),
      ...limitStateValidator,
      repositories: v.array(repositoryOptionValidator),
    }),
  ),
  handler: async (ctx, args): Promise<CompleteInstallationResult> => {
    const access: ActiveUserAccess =
      await requireSignedInActiveUserAccess(ctx);
    const repositories = await listInstallationRepositories(args.installationId);

    if (repositories.length === 0) {
      throw new Error(
        "The GitHub App installation does not include any repositories.",
      );
    }

    await ctx.runMutation(internal.github.rememberGitHubInstallation, {
      userId: access.userId,
      githubInstallationId: args.installationId,
    });

    if (repositories.length === 1) {
      const repo = repositories[0];
      const connectedRepo: ConnectedRepository = await ctx.runMutation(
        internal.github.upsertConnectedRepo,
        {
          userId: access.userId,
          repoLimit: access.repoLimit,
          githubRepoId: repo.githubRepoId,
          fullName: repo.fullName,
          private: repo.private,
          htmlUrl: repo.htmlUrl,
          githubInstallationId: args.installationId,
          githubAccountLogin: ownerLogin(repo.fullName),
          connectedAt: Date.now(),
        },
      );

      const repoCount: number = await ctx.runQuery(
        internal.github.connectedRepoCount,
        {
          userId: access.userId,
        },
      );

      return {
        kind: "connected",
        plan: access.plan,
        repoLimit: access.repoLimit,
        repoCount,
        canConnectMore: repoCount < access.repoLimit,
        repo: connectedRepo,
      };
    }

    const repoCount: number = await ctx.runQuery(
      internal.github.connectedRepoCount,
      {
        userId: access.userId,
      },
    );

    return {
      kind: "selectionRequired",
      plan: access.plan,
      repoLimit: access.repoLimit,
      repoCount,
      canConnectMore: repoCount < access.repoLimit,
      repositories,
    };
  },
});

export const connectInstalledRepository = action({
  args: {
    installationId: v.string(),
    githubRepoId: v.string(),
  },
  returns: v.object({
    kind: v.literal("connected"),
    ...limitStateValidator,
    repo: connectedRepositoryValidator,
  }),
  handler: async (ctx, args): Promise<ConnectInstalledRepositoryResult> => {
    const access: ActiveUserAccess =
      await requireSignedInActiveUserAccess(ctx);
    const repositories = await listInstallationRepositories(args.installationId);
    await ctx.runMutation(internal.github.rememberGitHubInstallation, {
      userId: access.userId,
      githubInstallationId: args.installationId,
    });
    const repo = repositories.find(
      (repository) => repository.githubRepoId === args.githubRepoId,
    );

    if (!repo) {
      throw new Error(
        "That repository is not part of this GitHub App installation.",
      );
    }

    const connectedRepo: ConnectedRepository = await ctx.runMutation(
      internal.github.upsertConnectedRepo,
      {
        userId: access.userId,
        repoLimit: access.repoLimit,
        githubRepoId: repo.githubRepoId,
        fullName: repo.fullName,
        private: repo.private,
        htmlUrl: repo.htmlUrl,
        githubInstallationId: args.installationId,
        githubAccountLogin: ownerLogin(repo.fullName),
        connectedAt: Date.now(),
      },
    );

    const repoCount: number = await ctx.runQuery(
      internal.github.connectedRepoCount,
      {
        userId: access.userId,
      },
    );

    return {
      kind: "connected",
      plan: access.plan,
      repoLimit: access.repoLimit,
      repoCount,
      canConnectMore: repoCount < access.repoLimit,
      repo: connectedRepo,
    };
  },
});

export const installedRepositoryOptions = action({
  args: {},
  returns: v.object({
    kind: v.literal("selectionRequired"),
    ...limitStateValidator,
    installationId: v.string(),
    repositories: v.array(repositoryOptionValidator),
  }),
  handler: async (ctx): Promise<InstalledRepositoryOptionsResult> => {
    const access: ActiveUserAccess =
      await requireSignedInActiveUserAccess(ctx);
    const installationId: string | null = await ctx.runQuery(
      internal.github.currentGitHubInstallation,
      {
        userId: access.userId,
      },
    );

    if (installationId === null) {
      throw new Error(
        "Install the GitHub App before choosing installed repositories.",
      );
    }

    const repositories = await listInstallationRepositories(installationId);

    if (repositories.length === 0) {
      throw new Error(
        "The GitHub App installation does not include any repositories.",
      );
    }

    const repoCount: number = await ctx.runQuery(
      internal.github.connectedRepoCount,
      {
        userId: access.userId,
      },
    );

    return {
      kind: "selectionRequired",
      plan: access.plan,
      repoLimit: access.repoLimit,
      repoCount,
      canConnectMore: repoCount < access.repoLimit,
      installationId,
      repositories,
    };
  },
});

export const disconnectRepo = mutation({
  args: {
    githubRepoId: v.string(),
  },
  returns: v.object({
    disconnected: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Sign in before disconnecting a GitHub repo.");
    }

    const access: ActiveUserAccess = await ctx.runQuery(
      internal.github.requireActiveUserAccess,
      {
        clerkTokenIdentifier: identity.tokenIdentifier,
      },
    );
    const repo = await ctx.db
      .query("repos")
      .withIndex("by_userId_and_githubRepoId", (q) =>
        q.eq("userId", access.userId).eq("githubRepoId", args.githubRepoId),
      )
      .unique();

    if (repo === null) {
      return { disconnected: false };
    }

    await ctx.runMutation(internal.github.rememberGitHubInstallation, {
      userId: access.userId,
      githubInstallationId: repo.githubInstallationId,
    });
    await ctx.db.delete(repo._id);

    return { disconnected: true };
  },
});

export const requireActiveUserAccess = internalQuery({
  args: {
    clerkTokenIdentifier: v.string(),
  },
  returns: v.object({
    userId: v.id("users"),
    plan: v.union(v.literal("good"), v.literal("better")),
    repoLimit: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkTokenIdentifier", (q) =>
        q.eq("clerkTokenIdentifier", args.clerkTokenIdentifier),
      )
      .unique();

    if (user === null) {
      throw new Error("Subscribe before connecting a GitHub repo.");
    }

    const hasActiveSubscription: boolean = await ctx.runQuery(
      internal.billing.hasActiveSubscriptionForUser,
      { userId: user._id },
    );

    if (!hasActiveSubscription) {
      throw new Error("Subscribe before connecting a GitHub repo.");
    }

    const subscription = await getActiveSubscription(ctx, user._id);

    if (subscription === null) {
      throw new Error("Subscribe before connecting a GitHub repo.");
    }

    return {
      userId: user._id,
      plan: subscription.plan,
      repoLimit: repoLimitForPlan(subscription.plan),
    };
  },
});

export const connectedRepoCount = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const repos = await ctx.db
      .query("repos")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(REPO_LIMITS.better + 1);

    return repos.length;
  },
});

export const rememberGitHubInstallation = internalMutation({
  args: {
    userId: v.id("users"),
    githubInstallationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      githubInstallationId: args.githubInstallationId,
    });

    return null;
  },
});

export const currentGitHubInstallation = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (user?.githubInstallationId) {
      return user.githubInstallationId;
    }

    const repos = await ctx.db
      .query("repos")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);

    return repos[0]?.githubInstallationId ?? null;
  },
});

export const upsertConnectedRepo = internalMutation({
  args: {
    userId: v.id("users"),
    repoLimit: v.number(),
    githubRepoId: v.string(),
    fullName: v.string(),
    private: v.boolean(),
    htmlUrl: v.string(),
    githubInstallationId: v.string(),
    githubAccountLogin: v.optional(v.string()),
    connectedAt: v.number(),
  },
  returns: connectedRepositoryValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("repos")
      .withIndex("by_userId_and_githubRepoId", (q) =>
        q.eq("userId", args.userId).eq("githubRepoId", args.githubRepoId),
      )
      .unique();

    if (existing !== null) {
      await ctx.db.patch(existing._id, {
        fullName: args.fullName,
        private: args.private,
        htmlUrl: args.htmlUrl,
        githubInstallationId: args.githubInstallationId,
        githubAccountLogin: args.githubAccountLogin,
        connectedAt: args.connectedAt,
      });
      return {
        githubRepoId: args.githubRepoId,
        fullName: args.fullName,
        private: args.private,
        htmlUrl: args.htmlUrl,
        githubInstallationId: args.githubInstallationId,
        connectedAt: args.connectedAt,
      };
    }

    const existingRepos = await ctx.db
      .query("repos")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(args.repoLimit + 1);

    if (existingRepos.length >= args.repoLimit) {
      throw new Error(limitErrorMessage(args.repoLimit));
    }

    await ctx.db.insert("repos", {
      userId: args.userId,
      githubRepoId: args.githubRepoId,
      fullName: args.fullName,
      private: args.private,
      htmlUrl: args.htmlUrl,
      githubInstallationId: args.githubInstallationId,
      githubAccountLogin: args.githubAccountLogin,
      connectedAt: args.connectedAt,
    });

    return {
      githubRepoId: args.githubRepoId,
      fullName: args.fullName,
      private: args.private,
      htmlUrl: args.htmlUrl,
      githubInstallationId: args.githubInstallationId,
      connectedAt: args.connectedAt,
    };
  },
});

async function requireSignedInActiveUserAccess(
  ctx: ActionCtx,
): Promise<ActiveUserAccess> {
  const identity = await ctx.auth.getUserIdentity();

  if (identity === null) {
    throw new Error("Sign in before connecting a GitHub repo.");
  }

  const access: ActiveUserAccess = await ctx.runQuery(
    internal.github.requireActiveUserAccess,
    {
      clerkTokenIdentifier: identity.tokenIdentifier,
    },
  );

  return access;
}

async function getCurrentActiveUserAccess(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (identity === null) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkTokenIdentifier", (q) =>
      q.eq("clerkTokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (user === null) {
    return null;
  }

  const subscription = await getActiveSubscription(ctx, user._id);

  if (subscription === null) {
    return null;
  }

  return {
    userId: user._id,
    plan: subscription.plan,
    repoLimit: repoLimitForPlan(subscription.plan),
    ...(user.githubInstallationId
      ? { githubInstallationId: user.githubInstallationId }
      : {}),
  };
}

async function getActiveSubscription(ctx: QueryCtx, userId: Id<"users">) {
  const subscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId_and_status_and_currentPeriodEnd", (q) =>
      q
        .eq("userId", userId)
        .eq("status", "active")
        .gt("currentPeriodEnd", Date.now()),
    )
    .take(1);

  return subscriptions[0] ?? null;
}

async function listInstallationRepositories(installationId: string) {
  const token = await createInstallationAccessToken(installationId);
  const payload = await githubRequest<GitHubInstallationRepositoriesResponse>(
    "https://api.github.com/installation/repositories?per_page=100",
    token,
    { method: "GET" },
  );

  return payload.repositories.map((repo) => ({
    githubRepoId: String(repo.id),
    fullName: repo.full_name,
    private: repo.private,
    htmlUrl: repo.html_url,
  }));
}

export async function createInstallationAccessToken(installationId: string) {
  const appJwt = await createGitHubAppJwt();
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${appJwt}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        permissions: {
          contents: "read",
          metadata: "read",
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub request failed: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as GitHubInstallationTokenResponse;

  return payload.token;
}

async function githubRequest<T>(
  url: string,
  token: string,
  init: RequestInit = {},
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub request failed: ${response.status} ${body}`);
  }

  return (await response.json()) as T;
}

async function createGitHubAppJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncodeJson({ alg: "RS256", typ: "JWT" });
  const payload = base64UrlEncodeJson({
    iat: now - 60,
    exp: now + 540,
    iss: env.GITHUB_APP_ID,
  });
  const unsignedToken = `${header}.${payload}`;
  const key = await importGitHubPrivateKey(env.GITHUB_APP_PRIVATE_KEY);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
}

async function importGitHubPrivateKey(privateKey: string) {
  const normalized = privateKey.replace(/\\n/g, "\n");
  const keyBytes = normalized.includes("-----BEGIN RSA PRIVATE KEY-----")
    ? wrapPkcs1PrivateKeyAsPkcs8(pemToDer(normalized, "RSA PRIVATE KEY"))
    : pemToDer(normalized, "PRIVATE KEY");

  return await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
}

function pemToDer(pem: string, label: "PRIVATE KEY" | "RSA PRIVATE KEY") {
  const base64 = pem
    .replace(`-----BEGIN ${label}-----`, "")
    .replace(`-----END ${label}-----`, "")
    .replace(/\s/g, "");

  if (base64.length === pem.replace(/\s/g, "").length) {
    throw new Error(`GitHub App private key must be a ${label} PEM.`);
  }

  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function wrapPkcs1PrivateKeyAsPkcs8(pkcs1PrivateKey: Uint8Array) {
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const rsaEncryptionAlgorithmIdentifier = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01,
    0x01, 0x05, 0x00,
  ]);
  const privateKeyOctetString = derEncode(0x04, pkcs1PrivateKey);

  return derEncode(
    0x30,
    concatBytes(
      version,
      rsaEncryptionAlgorithmIdentifier,
      privateKeyOctetString,
    ),
  );
}

function derEncode(tag: number, value: Uint8Array) {
  return concatBytes(new Uint8Array([tag]), derLength(value.length), value);
}

function derLength(length: number) {
  if (length < 0x80) {
    return new Uint8Array([length]);
  }

  const bytes: number[] = [];
  let remaining = length;

  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>= 8;
  }

  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function concatBytes(...chunks: Uint8Array[]) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return bytes;
}

function base64UrlEncodeJson(value: unknown) {
  return base64UrlEncodeBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function repoToConnectedRepository(repo: Doc<"repos">) {
  return {
    githubRepoId: repo.githubRepoId,
    fullName: repo.fullName,
    private: repo.private,
    htmlUrl: repo.htmlUrl,
    githubInstallationId: repo.githubInstallationId,
    connectedAt: repo.connectedAt,
  };
}

function repoLimitForPlan(plan: Plan) {
  return REPO_LIMITS[plan];
}

function limitErrorMessage(repoLimit: number) {
  if (repoLimit === REPO_LIMITS.good) {
    return "Good supports 1 connected repo. Upgrade to Better to connect up to 5 repos.";
  }

  return "Better supports 5 connected repos. Disconnect a repo before adding another one.";
}

function ownerLogin(fullName: string) {
  return fullName.split("/")[0];
}

type GitHubInstallationTokenResponse = {
  token: string;
};

type GitHubInstallationRepositoriesResponse = {
  repositories: GitHubRepo[];
};

type GitHubRepo = {
  id: number | string;
  full_name: string;
  private: boolean;
  html_url: string;
};
