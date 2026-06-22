const X_CREATE_POST_URL = "https://api.x.com/2/tweets";
const X_MEDIA_UPLOAD_URL = "https://api.x.com/2/media/upload";

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
  };
  errors?: unknown[];
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

export async function uploadTweetImage({
  accessToken,
  file,
  mediaType,
  mediaCategory,
}: {
  accessToken: string;
  file: File;
  mediaType: string;
  mediaCategory: "tweet_image";
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
    throw new Error(safeXMediaUploadErrorMessage(response.status));
  }

  const payload = (await response.json()) as XMediaUploadResponse;
  if (payload.errors && payload.errors.length > 0) {
    throw new Error("X media upload returned errors.");
  }

  const mediaId = payload.data?.id;

  if (typeof mediaId !== "string" || mediaId.length === 0) {
    throw new Error("X did not return a media id.");
  }

  return { mediaId };
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

function safeXMediaUploadErrorMessage(status: number) {
  switch (status) {
    case 401:
    case 403:
      return "X connection expired. Reconnect X before uploading media.";
    case 429:
      return "X is rate limiting media uploads right now. Try again in a minute.";
    default:
      if (status >= 500) {
        return "X is temporarily unavailable. Try again in a minute.";
      }

      return "X media upload failed. Try again.";
  }
}
