const X_CREATE_POST_URL = "https://api.x.com/2/tweets";
const X_POST_LOOKUP_URL = "https://api.x.com/2/tweets";
const X_MEDIA_UPLOAD_URL = "https://api.x.com/2/media/upload";
const X_LEGACY_MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";
const FULL_POST_METRIC_FIELDS =
  "public_metrics,non_public_metrics,organic_metrics";
const PUBLIC_POST_METRIC_FIELDS = "public_metrics";

type CreateXPostBody = {
  text: string;
  media?: {
    media_ids: string[];
  };
};

type CreateXPostResponse = {
  data?: {
    id?: unknown;
  };
  errors?: unknown[];
};

type XMediaUploadResponse = {
  data?: {
    id?: unknown;
    media_id?: unknown;
  };
  media_id?: unknown;
  errors?: unknown[];
};

type XLegacyMediaUploadResponse = {
  media_id?: unknown;
  media_id_string?: unknown;
  errors?: unknown[];
};

type XPostLookupResponse = {
  data?: {
    public_metrics?: unknown;
    non_public_metrics?: unknown;
    organic_metrics?: unknown;
  };
  errors?: unknown[];
};

export type XPostMetrics = {
  metricsAccess: "full" | "public_only";
  likeCount: number;
  replyCount: number;
  retweetCount: number;
  quoteCount: number;
  impressionCount?: number;
  urlLinkClicks?: number;
  userProfileClicks?: number;
  engagements?: number;
};

type MediaUploadLogContext = {
  attemptId: string;
  mediaCategory: "tweet_image";
  mediaType: string;
  fileSize: number;
  hasLegacyCredentials: boolean;
};

export type LegacyMediaUploadCredentials = {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  ownerUserId: string;
};

export async function createXPost({
  accessToken,
  text,
  mediaId,
}: {
  accessToken: string;
  text: string;
  mediaId?: string;
}) {
  const body: CreateXPostBody = { text };

  if (mediaId) {
    body.media = {
      media_ids: [mediaId],
    };
  }

  const response = await fetch(X_CREATE_POST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(safeXPostErrorMessage(response.status));
  }

  const payload = (await response.json()) as CreateXPostResponse;
  if (payload.errors && payload.errors.length > 0) {
    throw new Error("X post request returned errors.");
  }

  const xPostId = payload.data?.id;

  if (typeof xPostId !== "string" || xPostId.length === 0) {
    throw new Error("X did not return a post id.");
  }

  return { xPostId };
}

export async function fetchXPostMetrics({
  accessToken,
  xPostId,
}: {
  accessToken: string;
  xPostId: string;
}): Promise<XPostMetrics> {
  try {
    return await fetchXPostMetricsWithFields({
      accessToken,
      xPostId,
      fields: FULL_POST_METRIC_FIELDS,
      metricsAccess: "full",
    });
  } catch (err) {
    if (!isXPostMetricFallbackError(err)) {
      throw err;
    }

    return await fetchXPostMetricsWithFields({
      accessToken,
      xPostId,
      fields: PUBLIC_POST_METRIC_FIELDS,
      metricsAccess: "public_only",
    });
  }
}

async function fetchXPostMetricsWithFields({
  accessToken,
  xPostId,
  fields,
  metricsAccess,
}: {
  accessToken: string;
  xPostId: string;
  fields: string;
  metricsAccess: "full" | "public_only";
}) {
  const url = new URL(`${X_POST_LOOKUP_URL}/${encodeURIComponent(xPostId)}`);
  url.searchParams.set("tweet.fields", fields);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (metricsAccess === "full" && canFallBackToPublicMetrics(response.status)) {
      throw new XPostMetricFallbackError(response.status);
    }

    throw new Error(safeXPostMetricErrorMessage(response.status));
  }

  const payload = (await response
    .json()
    .catch(() => ({}))) as XPostLookupResponse;

  if (payload.errors && payload.errors.length > 0) {
    if (metricsAccess === "full") {
      throw new XPostMetricFallbackError(response.status);
    }

    throw new Error("X metrics request returned errors.");
  }

  return metricsFromPostLookup(payload, metricsAccess);
}

export async function uploadTweetImage({
  accessToken,
  file,
  mediaType,
  mediaCategory,
  legacyCredentials,
}: {
  accessToken: string;
  file: File;
  mediaType: string;
  mediaCategory: "tweet_image";
  legacyCredentials?: LegacyMediaUploadCredentials;
}) {
  const logContext = mediaUploadLogContext({
    file,
    mediaType,
    mediaCategory,
    hasLegacyCredentials: legacyCredentials !== undefined,
  });

  logXMediaUpload("x_media_upload_start", logContext);

  try {
    const result = await uploadOneShotTweetImage({
      accessToken,
      file,
      mediaType,
      mediaCategory,
      logContext,
    });
    logXMediaUpload("x_media_upload_complete", logContext, {
      path: "v2_oneshot",
    });

    return result;
  } catch (err) {
    if (
      isXMediaUploadHttpError(err) &&
      err.status === 403 &&
      legacyCredentials
    ) {
      warnXMediaUpload("x_media_upload_legacy_fallback", logContext, {
        status: err.status,
      });

      try {
        const result = await uploadLegacyTweetImage({
          credentials: legacyCredentials,
          file,
          mediaType,
          mediaCategory,
          logContext,
        });
        logXMediaUpload("x_media_upload_complete", logContext, {
          path: "legacy",
        });

        return result;
      } catch (legacyErr) {
        warnXMediaUpload("x_media_upload_failed", logContext, {
          path: "legacy",
          ...errorLogFields(legacyErr),
        });
        throw legacyErr;
      }
    }

    warnXMediaUpload("x_media_upload_failed", logContext, {
      path: "v2_oneshot",
      ...errorLogFields(err),
    });
    throw err;
  }
}

async function uploadOneShotTweetImage({
  accessToken,
  file,
  mediaType,
  mediaCategory,
  logContext,
}: {
  accessToken: string;
  file: File;
  mediaType: string;
  mediaCategory: "tweet_image";
  logContext: MediaUploadLogContext;
}) {
  const body = new FormData();
  body.append("media", file, file.name || "dispatch-upload");
  body.append("media_category", mediaCategory);
  body.append("media_type", mediaType);

  const response = await fetch(X_MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body,
  });

  if (!response.ok) {
    const responseFields = await xResponseErrorLogFields(response);

    warnXMediaUpload("x_media_upload_request_failed", logContext, {
      endpoint: "/2/media/upload",
      ...responseFields,
    });
    throw new XMediaUploadHttpError(
      response.status,
      safeXMediaUploadErrorMessage(response.status),
    );
  }

  logXMediaUpload("x_media_upload_request_succeeded", logContext, {
    endpoint: "/2/media/upload",
    ...xResponseLogFields(response),
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as XMediaUploadResponse;

  if (payload.errors && payload.errors.length > 0) {
    warnXMediaUpload("x_media_upload_payload_errors", logContext, {
      errorCount: payload.errors.length,
      ...xErrorPayloadLogFields(payload),
    });
    throw new Error("X media upload returned errors.");
  }

  const mediaId = mediaIdFromPayload(payload);
  if (typeof mediaId !== "string" || mediaId.length === 0) {
    warnXMediaUpload("x_media_upload_missing_media_id", logContext, {});
    throw new Error("X did not return a media id.");
  }

  return { mediaId };
}

function mediaIdFromPayload(payload: XMediaUploadResponse) {
  const mediaId = payload.data?.media_id ?? payload.data?.id ?? payload.media_id;

  if (typeof mediaId === "string" && mediaId.length > 0) {
    return mediaId;
  }

  if (typeof mediaId === "number") {
    return String(mediaId);
  }

  return null;
}

async function uploadLegacyTweetImage({
  credentials,
  file,
  mediaType,
  mediaCategory,
  logContext,
}: {
  credentials: LegacyMediaUploadCredentials;
  file: File;
  mediaType: string;
  mediaCategory: "tweet_image";
  logContext: MediaUploadLogContext;
}) {
  logXMediaUpload("x_media_upload_legacy_started", logContext);

  const body = new FormData();
  body.append("media", file, file.name || "dispatch-upload");
  body.append("media_category", mediaCategory);
  body.append("media_type", mediaType);
  body.append("additional_owners", credentials.ownerUserId);

  const response = await fetch(X_LEGACY_MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: await legacyOAuthAuthorizationHeader({
        credentials,
        method: "POST",
        url: X_LEGACY_MEDIA_UPLOAD_URL,
      }),
    },
    body,
  });

  if (!response.ok) {
    const responseFields = await xResponseErrorLogFields(response);

    warnXMediaUpload("x_media_upload_legacy_failed", logContext, {
      endpoint: "/1.1/media/upload.json",
      ...responseFields,
    });
    throw new Error(safeXLegacyMediaUploadErrorMessage(response.status));
  }

  logXMediaUpload("x_media_upload_legacy_succeeded", logContext, {
    endpoint: "/1.1/media/upload.json",
    ...xResponseLogFields(response),
  });

  const payload = (await response.json()) as XLegacyMediaUploadResponse;
  if (payload.errors && payload.errors.length > 0) {
    warnXMediaUpload("x_media_upload_payload_errors", logContext, {
      path: "legacy",
      errorCount: payload.errors.length,
      ...xErrorPayloadLogFields(payload),
    });
    throw new Error("X media upload returned errors.");
  }

  const mediaId =
    typeof payload.media_id_string === "string" &&
    payload.media_id_string.length > 0
      ? payload.media_id_string
      : typeof payload.media_id === "number"
        ? String(payload.media_id)
        : undefined;

  if (typeof mediaId !== "string" || mediaId.length === 0) {
    warnXMediaUpload("x_media_upload_missing_media_id", logContext, {
      path: "legacy",
    });
    throw new Error("X did not return a media id.");
  }

  return { mediaId };
}

function mediaUploadLogContext({
  file,
  mediaType,
  mediaCategory,
  hasLegacyCredentials,
}: {
  file: File;
  mediaType: string;
  mediaCategory: "tweet_image";
  hasLegacyCredentials: boolean;
}): MediaUploadLogContext {
  return {
    attemptId: randomBase64Url(12),
    mediaCategory,
    mediaType,
    fileSize: file.size,
    hasLegacyCredentials,
  };
}

function logXMediaUpload(
  event: string,
  context: MediaUploadLogContext,
  details: Record<string, unknown> = {},
) {
  console.info(
    "[x-media-upload]",
    compactLogFields({ event, ...context, ...details }),
  );
}

function warnXMediaUpload(
  event: string,
  context: MediaUploadLogContext,
  details: Record<string, unknown> = {},
) {
  console.warn(
    "[x-media-upload]",
    compactLogFields({ event, ...context, ...details }),
  );
}

async function xResponseErrorLogFields(response: Response) {
  const payload = await response.json().catch(() => null);

  return {
    ...xResponseLogFields(response),
    ...xErrorPayloadLogFields(payload),
  };
}

function xResponseLogFields(response: Response) {
  return {
    status: response.status,
    statusText: response.statusText || undefined,
    contentType: response.headers.get("content-type") ?? undefined,
    xRequestId: response.headers.get("x-request-id") ?? undefined,
    xRateLimitLimit: response.headers.get("x-rate-limit-limit") ?? undefined,
    xRateLimitRemaining:
      response.headers.get("x-rate-limit-remaining") ?? undefined,
    xRateLimitReset: response.headers.get("x-rate-limit-reset") ?? undefined,
  };
}

function xErrorPayloadLogFields(payload: unknown) {
  const payloadRecord = objectRecord(payload);
  const firstErrorRecord =
    payloadRecord && Array.isArray(payloadRecord.errors)
      ? payloadRecord.errors.map(objectRecord).find(Boolean)
      : null;
  const errorSource = firstErrorRecord ?? payloadRecord;

  return compactLogFields({
    xErrorType: safeLogString(errorSource?.type),
    xErrorTitle: safeLogString(errorSource?.title),
    xErrorDetail: safeLogString(errorSource?.detail),
    xErrorCode: safeLogString(errorSource?.code),
    xErrorCount:
      payloadRecord && Array.isArray(payloadRecord.errors)
        ? payloadRecord.errors.length
        : undefined,
  });
}

function errorLogFields(error: unknown) {
  if (isXMediaUploadHttpError(error)) {
    return {
      status: error.status,
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  return {
    errorName: "UnknownError",
  };
}

function compactLogFields(fields: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function safeLogString(value: unknown) {
  if (typeof value === "string") {
    return value.slice(0, 240);
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

async function legacyOAuthAuthorizationHeader({
  credentials,
  method,
  url,
}: {
  credentials: LegacyMediaUploadCredentials;
  method: "POST";
  url: string;
}) {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_nonce: randomBase64Url(24),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };
  const signature = await oauth1Signature({
    consumerSecret: credentials.consumerSecret,
    method,
    params: oauthParams,
    tokenSecret: credentials.accessTokenSecret,
    url,
  });
  const headerParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return `OAuth ${Object.entries(headerParams)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${oauthPercentEncode(key)}="${oauthPercentEncode(value)}"`,
    )
    .join(", ")}`;
}

async function oauth1Signature({
  consumerSecret,
  method,
  params,
  tokenSecret,
  url,
}: {
  consumerSecret: string;
  method: string;
  params: Record<string, string>;
  tokenSecret: string;
  url: string;
}) {
  const parameterString = Object.entries(params)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keySort = leftKey.localeCompare(rightKey);
      return keySort === 0 ? leftValue.localeCompare(rightValue) : keySort;
    })
    .map(
      ([key, value]) =>
        `${oauthPercentEncode(key)}=${oauthPercentEncode(value)}`,
    )
    .join("&");
  const baseString = [
    method.toUpperCase(),
    oauthPercentEncode(url),
    oauthPercentEncode(parameterString),
  ].join("&");
  const signingKey = `${oauthPercentEncode(consumerSecret)}&${oauthPercentEncode(
    tokenSecret,
  )}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(baseString),
  );

  return arrayBufferToBase64(signature);
}

function oauthPercentEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function randomBase64Url(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  return arrayBufferToBase64(bytes.buffer)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

class XMediaUploadHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "XMediaUploadHttpError";
    this.status = status;
  }
}

function isXMediaUploadHttpError(error: unknown) {
  return error instanceof XMediaUploadHttpError;
}

class XPostMetricFallbackError extends Error {
  status: number;

  constructor(status: number) {
    super("X private post metrics unavailable.");
    this.name = "XPostMetricFallbackError";
    this.status = status;
  }
}

function isXPostMetricFallbackError(error: unknown) {
  return error instanceof XPostMetricFallbackError;
}

function canFallBackToPublicMetrics(status: number) {
  return status === 400 || status === 401 || status === 403;
}

function metricsFromPostLookup(
  payload: XPostLookupResponse,
  metricsAccess: "full" | "public_only",
): XPostMetrics {
  const publicMetrics = objectRecord(payload.data?.public_metrics);
  const organicMetrics = objectRecord(payload.data?.organic_metrics);
  const nonPublicMetrics = objectRecord(payload.data?.non_public_metrics);

  if (publicMetrics === null) {
    throw new Error("X did not return public post metrics.");
  }

  const likeCount = metricNumber(publicMetrics.like_count) ?? 0;
  const replyCount = metricNumber(publicMetrics.reply_count) ?? 0;
  const retweetCount = metricNumber(publicMetrics.retweet_count) ?? 0;
  const quoteCount = metricNumber(publicMetrics.quote_count) ?? 0;
  const impressionCount =
    metricNumber(nonPublicMetrics?.impression_count) ??
    metricNumber(organicMetrics?.impression_count) ??
    metricNumber(publicMetrics.impression_count);
  const urlLinkClicks =
    metricNumber(nonPublicMetrics?.url_link_clicks) ??
    metricNumber(organicMetrics?.url_link_clicks);
  const userProfileClicks =
    metricNumber(nonPublicMetrics?.user_profile_clicks) ??
    metricNumber(organicMetrics?.user_profile_clicks);
  const engagements = metricNumber(nonPublicMetrics?.engagements);

  return compactLogFields({
    metricsAccess,
    likeCount,
    replyCount,
    retweetCount,
    quoteCount,
    impressionCount,
    urlLinkClicks,
    userProfileClicks,
    engagements,
  }) as XPostMetrics;
}

function metricNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function safeXPostErrorMessage(status: number) {
  switch (status) {
    case 401:
    case 403:
      return "X connection expired. Reconnect X before posting.";
    case 429:
      return "X is rate limiting posts right now. Try again in a minute.";
    default:
      if (status >= 500) {
        return "X is temporarily unavailable. Try again in a minute.";
      }

      return "X post failed. Try again.";
  }
}

function safeXPostMetricErrorMessage(status: number) {
  switch (status) {
    case 401:
    case 403:
      return "X connection expired. Reconnect X before refreshing analytics.";
    case 404:
      return "X post metrics are unavailable for this post.";
    case 429:
      return "X is rate limiting analytics refreshes right now.";
    default:
      if (status >= 500) {
        return "X analytics are temporarily unavailable.";
      }

      return "X analytics refresh failed.";
  }
}

function safeXMediaUploadErrorMessage(status: number) {
  switch (status) {
    case 401:
      return "X connection expired. Reconnect X before uploading media.";
    case 403:
      return "X image upload is unavailable for this X API configuration. Post text-only or configure legacy X media upload credentials.";
    case 429:
      return "X is rate limiting media uploads right now. Try again in a minute.";
    default:
      if (status >= 500) {
        return "X is temporarily unavailable. Try again in a minute.";
      }

      return "X media upload failed. Try again.";
  }
}

function safeXLegacyMediaUploadErrorMessage(status: number) {
  switch (status) {
    case 401:
    case 403:
      return "X image upload is unavailable for this X API configuration. Post text-only or configure legacy X media upload credentials.";
    case 429:
      return "X is rate limiting media uploads right now. Try again in a minute.";
    default:
      if (status >= 500) {
        return "X is temporarily unavailable. Try again in a minute.";
      }

      return "X media upload failed. Try again.";
  }
}
