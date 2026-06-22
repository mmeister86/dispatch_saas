"use client";

import { useAuth } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type DraftReviewItem = {
  _id: Id<"drafts">;
  repoFullName: string;
  commitSha: string;
  commitMessage: string;
  variants: string[];
  chosenText?: string;
  mediaId?: string;
  status: "draft" | "posted" | "discarded";
  xPostId?: string;
  postedAt?: number;
  createdAt: number;
};

type SidebarRepoSection = {
  key: string;
  fullName: string;
};

type ActiveAccess = {
  email?: string;
  plan: "good" | "better";
  currentPeriodEnd: number;
  postsThisPeriod: number;
  postLimit: number;
  postsRemaining: number;
};

export function DraftsWorkspace() {
  const access = useQuery(api.billing.currentAccess);

  if (access === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3efe7] px-6 text-[#181411]">
        <p className="text-sm font-medium text-[#786f64]">
          Loading drafts workspace...
        </p>
      </main>
    );
  }

  if (access.state !== "active") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3efe7] px-6 text-[#181411]">
        <section className="w-full max-w-md rounded-[28px] border border-[#ded4c5] bg-[#fffdf8] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <p className="text-sm font-semibold text-[#2f8a67]">
            Drafts workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">
            Subscribe before reviewing drafts.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#625a51]">
            Return to the Dispatch workspace to choose a plan and connect your
            accounts.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center rounded-full bg-[#181411] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2a241f]"
            href="/"
          >
            Back to workspace
          </Link>
        </section>
      </main>
    );
  }

  return <ActiveDraftsWorkspace access={access} />;
}

function ActiveDraftsWorkspace({ access }: { access: ActiveAccess }) {
  const connectedRepos = useQuery(api.github.connectedRepos);
  const drafts = useQuery(api.drafts.listForReview);
  const postDraft = useAction(api.x.postDraft);
  const { getToken } = useAuth();
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<Record<string, string>>({});
  const [postingDraftId, setPostingDraftId] = useState<string | null>(null);
  const [uploadingDraftId, setUploadingDraftId] = useState<string | null>(null);
  const [noticeByDraftId, setNoticeByDraftId] = useState<Record<string, string>>(
    {},
  );
  const [errorByDraftId, setErrorByDraftId] = useState<Record<string, string>>(
    {},
  );
  const repos = connectedRepos?.repos;
  const draftGroups = useMemo(
    () => groupDraftsByRepo(drafts ?? []),
    [drafts],
  );
  const connectedRepoNames = useMemo(
    () => new Set((repos ?? []).map((repo) => repo.fullName)),
    [repos],
  );
  const unmatchedDraftRepoNames = useMemo(
    () =>
      Array.from(draftGroups.keys()).filter(
        (repoFullName) => !connectedRepoNames.has(repoFullName),
      ),
    [connectedRepoNames, draftGroups],
  );
  const repoSections = useMemo(
    () => [
      ...(repos ?? []).map((repo) => ({
        fullName: repo.fullName,
        key: repo.githubRepoId,
      })),
      ...unmatchedDraftRepoNames.map((repoFullName) => ({
        fullName: repoFullName,
        key: `draft:${repoFullName}`,
      })),
    ],
    [repos, unmatchedDraftRepoNames],
  );
  const firstDraftId = drafts?.[0]?._id ?? null;
  const hasConnectedRepos = (repos ?? []).length > 0;
  const hasDrafts = (drafts ?? []).length > 0;

  useEffect(() => {
    if (selectedDraftId !== null || firstDraftId === null) {
      return;
    }

    setSelectedDraftId(firstDraftId);
  }, [firstDraftId, selectedDraftId]);

  async function handlePost(draft: DraftReviewItem) {
    const text = selectedTextForDraft(draft).trim();

    if (text.length === 0 || draft.status !== "draft") {
      return;
    }

    setPostingDraftId(draft._id);
    setErrorByDraftId((current) => ({ ...current, [draft._id]: "" }));
    setNoticeByDraftId((current) => ({ ...current, [draft._id]: "" }));

    try {
      const result = await postDraft({ draftId: draft._id, text });
      setNoticeByDraftId((current) => ({
        ...current,
        [draft._id]: `Posted to X as ${result.xPostId}.`,
      }));
    } catch (err) {
      setErrorByDraftId((current) => ({
        ...current,
        [draft._id]: userFacingActionError(
          errorMessage(err, "Posting failed. Try again."),
        ),
      }));
    } finally {
      setPostingDraftId(null);
    }
  }

  async function handleUpload(draft: DraftReviewItem, file: File | null) {
    if (file === null || draft.status !== "draft") {
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

    if (!siteUrl) {
      setErrorByDraftId((current) => ({
        ...current,
        [draft._id]: "Missing Convex site URL for uploads.",
      }));
      return;
    }

    setUploadingDraftId(draft._id);
    setErrorByDraftId((current) => ({ ...current, [draft._id]: "" }));
    setNoticeByDraftId((current) => ({ ...current, [draft._id]: "" }));

    try {
      const token = await getToken({ template: "convex" });

      if (!token) {
        throw new Error("Sign in again before uploading media.");
      }

      const formData = new FormData();
      formData.append("draftId", draft._id);
      formData.append("file", file);

      const response = await fetch(`${siteUrl}/x/media/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        mediaId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Image upload failed.");
      }

      setNoticeByDraftId((current) => ({
        ...current,
        [draft._id]: "Image attached.",
      }));
    } catch (err) {
      setErrorByDraftId((current) => ({
        ...current,
        [draft._id]: userFacingActionError(
          errorMessage(err, "Image upload failed. Try again."),
        ),
      }));
    } finally {
      setUploadingDraftId(null);
    }
  }

  function selectedTextForDraft(draft: DraftReviewItem) {
    return draftText[draft._id] ?? draft.chosenText ?? draft.variants[0] ?? "";
  }

  const selectedDraft =
    drafts?.find((draft: DraftReviewItem) => draft._id === selectedDraftId) ??
    null;
  const isLoading = connectedRepos === undefined || drafts === undefined;
  const isCapped = access.postsRemaining <= 0;
  const cappedMessage =
    access.plan === "good"
      ? "Upgrade to Better to keep posting this period."
      : `Your Better plan renews on ${formatDate(access.currentPeriodEnd)}.`;

  return (
    <main className="min-h-screen bg-[#f3efe7] p-3 text-[#181411] sm:p-5 lg:p-7">
      <div className="grid min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[28px] bg-[#fffaf2] shadow-[0_24px_80px_rgba(15,23,42,0.18)] ring-1 ring-[#d8cebf] sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(360px,380px)_minmax(0,1fr)]">
        <aside className="min-w-0 bg-[#171411] text-white lg:min-h-full">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 lg:px-6 lg:py-7">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[#69d4a1]">
                Dispatch
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                Drafts
              </h1>
              <p className="mt-2 text-xs leading-5 text-white/50">
                Pick a commit, tune the post, ship it.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
                href="/settings"
              >
                Settings
              </Link>
              <Link
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
                href="/"
              >
                Home
              </Link>
            </div>
          </div>

          {isLoading ? (
            <p className="px-6 py-5 text-sm text-white/50">
              Loading repositories...
            </p>
          ) : !hasConnectedRepos && !hasDrafts ? (
            <p className="px-6 py-5 text-sm leading-6 text-white/50">
              Connect a repository first. Open settings to choose the GitHub
              repo Dispatch should watch.
            </p>
          ) : (
            <div className="grid max-h-[44vh] min-w-0 gap-2 overflow-y-auto px-3 py-4 lg:max-h-[calc(100vh-156px)] lg:px-4">
              {repoSections.map((repo) => (
                <RepoDraftGroup
                  drafts={draftGroups.get(repo.fullName) ?? []}
                  key={repo.key}
                  repo={repo}
                  selectedDraftId={selectedDraftId}
                  setSelectedDraftId={setSelectedDraftId}
                />
              ))}
            </div>
          )}
        </aside>

        <section className="flex min-h-[70vh] items-start justify-center overflow-y-auto bg-[#f3efe7] px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
          {isLoading ? (
            <div className="w-full max-w-3xl rounded-[28px] border border-[#ded4c5] bg-[#fffdf8] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
              <p className="text-sm font-semibold text-[#2f8a67]">
                Draft detail
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal">
                Loading draft detail...
              </h2>
            </div>
          ) : selectedDraft ? (
            <DraftEditorCanvas
              cappedMessage={cappedMessage}
              draft={selectedDraft}
              error={errorByDraftId[selectedDraft._id] ?? ""}
              isCapped={isCapped}
              isPosting={postingDraftId === selectedDraft._id}
              isUploading={uploadingDraftId === selectedDraft._id}
              notice={noticeByDraftId[selectedDraft._id] ?? ""}
              onPost={() => void handlePost(selectedDraft)}
              onSelectVariant={(variant) =>
                setDraftText((current) => ({
                  ...current,
                  [selectedDraft._id]: variant,
                }))
              }
              onTextChange={(text) =>
                setDraftText((current) => ({
                  ...current,
                  [selectedDraft._id]: text,
                }))
              }
              onUpload={(file) => void handleUpload(selectedDraft, file)}
              selectedText={selectedTextForDraft(selectedDraft)}
            />
          ) : (
            <DraftsEmptyState
              hasConnectedRepos={hasConnectedRepos}
              hasDrafts={hasDrafts}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function DraftsEmptyState({
  hasConnectedRepos,
  hasDrafts,
}: {
  hasConnectedRepos: boolean;
  hasDrafts: boolean;
}) {
  if (!hasConnectedRepos) {
    return (
      <div className="w-full max-w-3xl rounded-[28px] border border-[#ded4c5] bg-[#fffdf8] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <p className="text-sm font-semibold text-[#2f8a67]">
          Draft detail
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal">
          Connect a repository first.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#625a51]">
          Dispatch needs one GitHub repo before it can turn commits into X
          drafts.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-full bg-[#181411] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2a241f]"
          href="/settings"
        >
          Open settings
        </Link>
      </div>
    );
  }

  if (!hasDrafts) {
    return (
      <div className="w-full max-w-3xl rounded-[28px] border border-[#ded4c5] bg-[#fffdf8] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <p className="text-sm font-semibold text-[#2f8a67]">
          Draft detail
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal">
          No commit drafts yet.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#625a51]">
          Push to a connected repository and Dispatch will drop the generated
          variants here.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-full bg-[#181411] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2a241f]"
          href="/settings"
        >
          Open settings
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl rounded-[28px] border border-[#ded4c5] bg-[#fffdf8] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
      <p className="text-sm font-semibold text-[#2f8a67]">Draft detail</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-normal">
        Select a commit draft.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#625a51]">
        Choose a commit from the sidebar to review variants, edit the post,
        attach an image, and publish to X.
      </p>
    </div>
  );
}

function RepoDraftGroup({
  drafts,
  repo,
  selectedDraftId,
  setSelectedDraftId,
}: {
  drafts: DraftReviewItem[];
  repo: SidebarRepoSection;
  selectedDraftId: string | null;
  setSelectedDraftId: (draftId: string) => void;
}) {
  return (
    <section className="min-w-0 rounded-2xl px-2 py-3">
      <h2 className="break-words px-2 text-sm font-semibold tracking-normal text-white/90">
        {repo.fullName}
      </h2>

      {drafts.length === 0 ? (
        <p className="mt-3 px-2 text-xs leading-5 text-white/35">
          No commit drafts yet.
        </p>
      ) : (
        <div className="mt-3 grid gap-2">
          {drafts.map((draft) => {
            const isSelected = selectedDraftId === draft._id;

            return (
              <button
                aria-pressed={isSelected}
                className={`w-full min-w-0 rounded-2xl border px-3.5 py-3 text-left text-sm transition-all ${
                  isSelected
                    ? "border-[#f5d08a] bg-[#fff1d4] text-[#171411] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                    : "border-white/5 bg-white/[0.04] text-white/70 hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
                }`}
                key={draft._id}
                onClick={() => setSelectedDraftId(draft._id)}
                type="button"
              >
                <span className="flex min-w-0 items-center justify-between gap-3">
                  <span className="font-semibold">
                    {draft.commitSha.slice(0, 7)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                      isSelected
                        ? "bg-[#171411] text-white"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {draft.status}
                  </span>
                </span>
                <span className="mt-2 block break-words text-xs leading-5 opacity-75">
                  {draft.commitMessage}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DraftEditorCanvas({
  cappedMessage,
  draft,
  error,
  isCapped,
  isPosting,
  isUploading,
  notice,
  onPost,
  onSelectVariant,
  onTextChange,
  onUpload,
  selectedText,
}: {
  cappedMessage: string;
  draft: DraftReviewItem;
  error: string;
  isCapped: boolean;
  isPosting: boolean;
  isUploading: boolean;
  notice: string;
  onPost: () => void;
  onSelectVariant: (variant: string) => void;
  onTextChange: (text: string) => void;
  onUpload: (file: File | null) => void;
  selectedText: string;
}) {
  const trimmedText = selectedText.trim();
  const canPost =
    draft.status === "draft" &&
    trimmedText.length > 0 &&
    trimmedText.length <= 280 &&
    !isCapped &&
    !isPosting &&
    !isUploading;
  const postReadinessId = `post-readiness-${draft._id}`;
  let postReadinessMessage = "Ready to publish to X.";

  if (draft.status !== "draft") {
    postReadinessMessage = "This draft is no longer editable.";
  } else if (trimmedText.length === 0) {
    postReadinessMessage = "Pick or write a post before publishing.";
  } else if (trimmedText.length > 280) {
    postReadinessMessage =
      "Shorten the post to 280 characters before publishing.";
  } else if (isCapped) {
    postReadinessMessage = cappedMessage;
  } else if (isUploading) {
    postReadinessMessage = "Image upload needs to finish before posting.";
  } else if (isPosting) {
    postReadinessMessage = "Publishing to X...";
  }

  return (
    <article className="w-full max-w-4xl rounded-[28px] border border-[#ded4c5] bg-[#fffdf8] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 border-b border-[#e7ded0] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[#2f8a67]">
            Draft detail
          </p>
          <h2 className="mt-2 break-words text-3xl font-semibold tracking-normal text-[#181411]">
            {draft.repoFullName}
          </h2>
          <p className="mt-2 break-words text-sm text-[#7b7166]">
            {draft.commitSha.slice(0, 7)} · {draft.commitMessage}
          </p>
        </div>
        <span className="w-fit rounded-full border border-[#ded4c5] bg-[#f8f2e9] px-3 py-1 text-xs font-semibold capitalize text-[#625a51]">
          {draft.status}
        </span>
      </div>

      {draft.status === "posted" && draft.xPostId ? (
        <p
          aria-live="polite"
          className="mt-5 rounded-2xl border border-[#bfe5d1] bg-[#ebf8ef] px-4 py-3 text-sm font-semibold text-[#1c7d53]"
          role="status"
        >
          Posted to X: {draft.xPostId}
        </p>
      ) : null}

      {isCapped ? (
        <div
          className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          role="alert"
        >
          <p className="font-semibold">Monthly post cap reached.</p>
          <p className="mt-1">
            You can keep editing this draft, but posting unlocks when the
            billing period renews or your plan changes.
          </p>
        </div>
      ) : null}

      {draft.variants.length === 0 ? (
        <p className="mt-6 text-sm text-[#7b7166]">Generating variants...</p>
      ) : (
        <div className="mt-6 grid gap-3">
          <p className="text-sm font-semibold text-[#181411]">
            Choose a variant
          </p>
          {draft.variants.map((variant) => {
            const isSelectedVariant = variant === selectedText;

            return (
              <button
                aria-pressed={isSelectedVariant}
                className={`rounded-2xl border p-4 text-left text-sm leading-6 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelectedVariant
                    ? "border-[#181411] bg-white text-[#181411] shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                    : "border-[#e5dbcb] bg-[#fffaf2] text-[#625a51] hover:border-[#d4c6b3]"
                }`}
                disabled={draft.status !== "draft"}
                key={variant}
                onClick={() => onSelectVariant(variant)}
                type="button"
              >
                <span>{variant}</span>
                {isSelectedVariant ? (
                  <span className="mt-3 block w-fit rounded-full bg-[#181411] px-2.5 py-1 text-xs font-semibold text-white">
                    Selected variant
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <textarea
        aria-label="Post text"
        className="mt-6 min-h-36 w-full resize-y rounded-2xl border border-[#d8cebf] bg-white p-5 text-base leading-7 text-[#181411] outline-none transition-colors placeholder:text-[#a79c90] focus:border-[#181411] disabled:cursor-not-allowed disabled:bg-[#f7f1e8]"
        disabled={draft.status !== "draft"}
        maxLength={280}
        onChange={(event) => onTextChange(event.target.value)}
        value={selectedText}
      />
      <p className="mt-2 text-right text-xs font-medium text-[#7b7166]">
        {selectedText.length}/280
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-[#e5dbcb] bg-[#f8f2e9] p-4">
        <label className="block text-sm">
          <span className="font-semibold text-[#181411]">Optional image</span>
          <input
            accept="image/png,image/jpeg,image/webp"
            className="mt-3 block w-full text-sm text-[#625a51] file:mr-4 file:rounded-full file:border-0 file:bg-[#181411] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            disabled={draft.status !== "draft" || isUploading}
            onChange={(event) => onUpload(event.currentTarget.files?.[0] ?? null)}
            type="file"
          />
        </label>
        <p className="text-xs text-[#7b7166]">
          {draft.mediaId ? "Image attached." : "Text-only is ready."}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          aria-describedby={postReadinessId}
          className="h-11 rounded-full bg-[#181411] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2a241f] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canPost}
          onClick={onPost}
          type="button"
        >
          {isPosting ? "Posting..." : "Post to X"}
        </button>
        <div
          aria-live="polite"
          className="flex flex-wrap items-center gap-3"
          role="status"
        >
          <p
            className="rounded-full bg-[#f8f2e9] px-3 py-1.5 text-sm font-semibold text-[#625a51]"
            id={postReadinessId}
          >
            {postReadinessMessage}
          </p>
          {isUploading ? (
            <p className="text-sm text-[#7b7166]">Uploading image...</p>
          ) : null}
          {notice ? (
            <p className="rounded-full bg-[#ebf8ef] px-3 py-1.5 text-sm font-semibold text-[#1c7d53]">
              {notice}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </article>
  );
}

function groupDraftsByRepo(drafts: DraftReviewItem[]) {
  const groups = new Map<string, DraftReviewItem[]>();

  for (const draft of drafts) {
    const repoDrafts = groups.get(draft.repoFullName) ?? [];
    repoDrafts.push(draft);
    groups.set(draft.repoFullName, repoDrafts);
  }

  return groups;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(timestamp);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function userFacingActionError(message: string) {
  if (
    message.includes("Reconnect X before posting") ||
    message.includes("Connect X before posting") ||
    message.includes("Connect X before uploading media")
  ) {
    return `${message} Open the X account panel from the workspace, reconnect, then try posting again.`;
  }

  if (
    message.includes("temporarily unavailable") ||
    message.includes("rate limiting")
  ) {
    if (message.includes("Try again in a minute")) {
      return `${message} Your draft was not posted.`;
    }

    return `${message} Try again in a minute; your draft was not posted.`;
  }

  return message;
}
