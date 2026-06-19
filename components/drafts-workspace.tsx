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
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <p className="text-sm text-zinc-400">Loading drafts workspace...</p>
      </main>
    );
  }

  if (access.state !== "active") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <section className="w-full max-w-md border border-white/15 bg-white p-6 text-black">
          <p className="text-sm font-medium text-zinc-500">Drafts workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">
            Subscribe before reviewing drafts.
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            Return to the Dispatch workspace to choose a plan and connect your
            accounts.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
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
        [draft._id]: errorMessage(err, "Posting failed. Try again."),
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
        [draft._id]: payload.mediaId
          ? `Image attached as ${payload.mediaId}.`
          : "Image attached.",
      }));
    } catch (err) {
      setErrorByDraftId((current) => ({
        ...current,
        [draft._id]: errorMessage(err, "Image upload failed. Try again."),
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
    <main className="min-h-screen bg-zinc-950 p-4 text-white sm:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] overflow-hidden border border-dashed border-white/55 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-dashed border-white/45 bg-zinc-950 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 border-b border-dashed border-white/45 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-emerald-300">Dispatch</p>
              <h1 className="mt-1 text-xl font-semibold tracking-normal">
                Drafts
              </h1>
            </div>
            <Link className="text-sm text-zinc-300 underline" href="/">
              Home
            </Link>
          </div>

          {isLoading ? (
            <p className="px-5 py-4 text-sm text-zinc-400">
              Loading repositories...
            </p>
          ) : repoSections.length === 0 ? (
            <p className="px-5 py-4 text-sm leading-6 text-zinc-400">
              No connected repositories or commit drafts yet. Connect a repo
              from the workspace.
            </p>
          ) : (
            <div className="grid max-h-[42vh] overflow-y-auto lg:max-h-[calc(100vh-112px)]">
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

        <section className="flex min-h-[70vh] items-start justify-center overflow-y-auto bg-zinc-950 px-4 py-6 sm:px-8 lg:px-12">
          {selectedDraft ? (
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
            <div className="w-full max-w-3xl border border-white/15 bg-white p-6 text-black">
              <p className="text-sm font-medium text-zinc-500">Draft detail</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                Select a commit draft.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-700">
                Choose a commit from the sidebar to review variants, edit the
                post, attach an image, and publish to X.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
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
    <section className="border-b border-dashed border-white/45 px-5 py-5">
      <h2 className="break-words text-lg font-semibold tracking-normal">
        {repo.fullName}
      </h2>

      {drafts.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          No commit drafts yet.
        </p>
      ) : (
        <div className="mt-4 grid gap-2">
          {drafts.map((draft) => {
            const isSelected = selectedDraftId === draft._id;

            return (
              <button
                className={`w-full border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-white bg-white text-black"
                    : "border-transparent text-zinc-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
                }`}
                key={draft._id}
                onClick={() => setSelectedDraftId(draft._id)}
                type="button"
              >
                <span className="block font-medium">
                  {draft.commitSha.slice(0, 7)}
                </span>
                <span className="mt-1 block truncate text-xs opacity-75">
                  {draft.commitMessage}
                </span>
                <span className="mt-2 block text-xs capitalize opacity-65">
                  {draft.status}
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
  const canPost =
    draft.status === "draft" &&
    selectedText.trim().length > 0 &&
    selectedText.trim().length <= 280 &&
    !isCapped &&
    !isPosting &&
    !isUploading;

  return (
    <article className="w-full max-w-3xl border border-zinc-300 bg-white p-6 text-black">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">Draft detail</p>
          <h2 className="mt-2 break-words text-2xl font-semibold tracking-normal">
            {draft.repoFullName}
          </h2>
          <p className="mt-1 break-words text-xs text-zinc-500">
            {draft.commitSha.slice(0, 7)} · {draft.commitMessage}
          </p>
        </div>
      </div>

      {draft.status === "posted" && draft.xPostId ? (
        <p className="mt-4 text-xs font-medium text-emerald-700">
          Posted: {draft.xPostId}
        </p>
      ) : null}

      {draft.variants.length === 0 ? (
        <p className="mt-5 text-sm text-zinc-500">Generating variants...</p>
      ) : (
        <div className="mt-5 grid gap-2">
          <p className="text-sm font-medium text-zinc-900">
            Choose a variant
          </p>
          {draft.variants.map((variant) => (
            <button
              className="border border-black/10 p-4 text-left text-sm leading-6 text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={draft.status !== "draft"}
              key={variant}
              onClick={() => onSelectVariant(variant)}
              type="button"
            >
              {variant}
            </button>
          ))}
        </div>
      )}

      <textarea
        aria-label="Post text"
        className="mt-5 min-h-32 w-full resize-y border border-black/20 p-4 text-sm leading-6 outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-zinc-50"
        disabled={draft.status !== "draft"}
        maxLength={280}
        onChange={(event) => onTextChange(event.target.value)}
        value={selectedText}
      />
      <p className="mt-1 text-xs text-zinc-500">{selectedText.length}/280</p>

      <div className="mt-5 grid gap-3">
        <label className="block text-sm">
          <span className="font-medium text-zinc-900">Optional image</span>
          <input
            accept="image/png,image/jpeg,image/webp"
            className="mt-2 block w-full text-sm"
            disabled={draft.status !== "draft" || isUploading}
            onChange={(event) => onUpload(event.currentTarget.files?.[0] ?? null)}
            type="file"
          />
        </label>
        <p className="text-xs text-zinc-500">
          {draft.mediaId
            ? `Attached media ${draft.mediaId}.`
            : "Text-only remains ready."}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="h-10 border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canPost}
          onClick={onPost}
          type="button"
        >
          {isPosting ? "Posting..." : "Post to X"}
        </button>
        {isUploading ? (
          <p className="text-sm text-zinc-500">Uploading image...</p>
        ) : null}
        {isCapped ? (
          <p className="text-sm text-amber-800">{cappedMessage}</p>
        ) : null}
        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      </div>

      {error ? (
        <div className="mt-5 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
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
