"use client";

import {
  Show,
  SignInButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

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

type PendingSelection = {
  installationId: string;
  repositories: RepositoryOption[];
};

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

type ActiveAccess = {
  email?: string;
  plan: "good" | "better";
  currentPeriodEnd: number;
  postsThisPeriod: number;
  postLimit: number;
  postsRemaining: number;
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-12 text-black">
      <section className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">Dispatch</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Commit-to-post workspace
            </h1>
          </div>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>

        <Show when="signed-out">
          <div className="flex flex-col gap-5">
            <p className="text-lg leading-8 text-zinc-700">
              Sign in with GitHub to subscribe and unlock your Dispatch
              workspace.
            </p>
            <SignInButton mode="modal">
              <button className="h-11 w-fit border border-black bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
                Sign in with GitHub
              </button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          <GuardedApp />
        </Show>
      </section>
    </main>
  );
}

function GuardedApp() {
  const { user } = useUser();
  const access = useQuery(api.billing.currentAccess);

  if (access === undefined) {
    return (
      <div className="border border-black/10 p-5">
        <p className="text-sm font-medium text-zinc-500">Subscription</p>
        <p className="mt-2 text-lg font-semibold">Checking access...</p>
      </div>
    );
  }

  if (access.state !== "active") {
    return (
      <PaywallView
        email={
          access.state === "needsSubscription"
            ? access.email ??
              user?.primaryEmailAddress?.emailAddress ??
              user?.fullName ??
              "Signed in"
            : "Signed in"
        }
      />
    );
  }

  return <SubscriberApp access={access} />;
}

function PaywallView({ email }: { email: string }) {
  const createCheckout = useAction(api.billing.createCheckout);
  const [checkoutPlan, setCheckoutPlan] = useState<"good" | "better" | null>(
    null,
  );

  async function handleCheckout(plan: "good" | "better") {
    setCheckoutPlan(plan);

    try {
      const checkout = await createCheckout({ plan });
      window.location.assign(checkout.url);
    } finally {
      setCheckoutPlan(null);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="border border-black/10 p-5">
        <p className="text-sm font-medium text-zinc-500">Signed in as</p>
        <p className="mt-2 text-lg font-semibold">{email}</p>
      </div>

      <div className="border border-black/10 p-5">
        <p className="text-sm font-medium text-zinc-500">Subscription needed</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">
          Choose a plan to enter Dispatch.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-700">
          Dispatch is pay-first so the commit-to-post flow can stay fast,
          private, and protected from public abuse.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="h-11 border border-black bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={checkoutPlan !== null}
            onClick={() => void handleCheckout("good")}
            type="button"
          >
            {checkoutPlan === "good" ? "Opening..." : "Start with Good"}
          </button>
          <button
            className="h-11 border border-black/20 bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={checkoutPlan !== null}
            onClick={() => void handleCheckout("better")}
            type="button"
          >
            {checkoutPlan === "better" ? "Opening..." : "Start with Better"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubscriberApp({
  access,
}: {
  access: ActiveAccess;
}) {
  const renewalDate = formatDate(access.currentPeriodEnd);

  return (
    <div className="grid gap-5">
      <div className="border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-medium text-emerald-700">
          Connected and paid
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">
          Your Dispatch workspace is unlocked.
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-700">
          Next up: connect the GitHub repo Dispatch should watch for commits.
        </p>
      </div>

      <GitHubRepoPanel />
      <XAccountPanel />
      <DraftReviewPanel access={access} />

      <dl className="grid gap-3 border border-black/10 p-5 text-sm sm:grid-cols-4">
        <div>
          <dt className="font-medium text-zinc-500">Plan</dt>
          <dd className="mt-1 capitalize">{access.plan}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Posts used</dt>
          <dd className="mt-1">
            {access.postsThisPeriod}/{access.postLimit}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Remaining</dt>
          <dd className="mt-1">{access.postsRemaining}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Renews</dt>
          <dd className="mt-1">{renewalDate}</dd>
        </div>
      </dl>
    </div>
  );
}

function DraftReviewPanel({ access }: { access: ActiveAccess }) {
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

  const isCapped = access.postsRemaining <= 0;
  const cappedMessage =
    access.plan === "good"
      ? "Upgrade to Better to keep posting this period."
      : `Your Better plan renews on ${formatDate(access.currentPeriodEnd)}.`;
  const selectedDraft =
    drafts?.find((draft: DraftReviewItem) => draft._id === selectedDraftId) ??
    null;

  return (
    <section className="border border-black/10 p-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Drafts inbox</p>
        <h2 className="mt-2 text-xl font-semibold tracking-normal">
          Your commits, already written
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
          Open a draft to choose a variant, tweak it, attach one image if it
          helps, then post to X.
        </p>
      </div>

      {isCapped ? (
        <div className="mt-4 border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          {cappedMessage}
        </div>
      ) : null}

      {drafts === undefined ? (
        <p className="mt-4 text-sm text-zinc-500">Loading drafts...</p>
      ) : drafts.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">
          No drafts yet. Push a commit to a connected repo to generate one.
        </p>
      ) : (
        <div className="mt-4 grid gap-2">
          {drafts.map((draft: DraftReviewItem) => (
            <button
              className="grid gap-3 border border-black/10 p-4 text-left transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-black"
              key={draft._id}
              onClick={() => setSelectedDraftId(draft._id)}
              type="button"
            >
              <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium text-zinc-900">
                    {draft.repoFullName}
                  </span>
                  <span className="mt-1 block break-words text-xs text-zinc-500">
                    {draft.commitSha.slice(0, 7)} · {draft.commitMessage}
                  </span>
                </span>
                <span className="w-fit border border-black/10 px-2 py-1 text-xs font-medium capitalize text-zinc-700">
                  {draft.status}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                <span>{formatDate(draft.createdAt)}</span>
                <span>{draft.variants.length} variants</span>
                <span>Open draft</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedDraft ? (
        <DraftDetailModal
          cappedMessage={cappedMessage}
          draft={selectedDraft}
          error={errorByDraftId[selectedDraft._id] ?? ""}
          isCapped={isCapped}
          isPosting={postingDraftId === selectedDraft._id}
          isUploading={uploadingDraftId === selectedDraft._id}
          notice={noticeByDraftId[selectedDraft._id] ?? ""}
          onClose={() => setSelectedDraftId(null)}
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
      ) : null}
    </section>
  );
}

function DraftDetailModal({
  cappedMessage,
  draft,
  error,
  isCapped,
  isPosting,
  isUploading,
  notice,
  onClose,
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
  onClose: () => void;
  onPost: () => void;
  onSelectVariant: (variant: string) => void;
  onTextChange: (text: string) => void;
  onUpload: (file: File | null) => void;
  selectedText: string;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedElement.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    return () => {
      previouslyFocusedElement.current?.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        trapDialogFocus(event, dialogRef.current);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const canPost =
    draft.status === "draft" &&
    selectedText.trim().length > 0 &&
    selectedText.trim().length <= 280 &&
    !isCapped &&
    !isPosting &&
    !isUploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/30 p-4 sm:items-center sm:justify-center"
      onMouseDown={onClose}
    >
      <article
        aria-labelledby="draft-detail-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-500">Draft detail</p>
            <h3
              className="mt-2 break-words text-xl font-semibold tracking-normal"
              id="draft-detail-title"
            >
              {draft.repoFullName}
            </h3>
            <p className="mt-1 break-words text-xs text-zinc-500">
              {draft.commitSha.slice(0, 7)} · {draft.commitMessage}
            </p>
          </div>
          <button
            className="h-10 w-fit border border-black/20 px-4 text-sm font-medium transition-colors hover:bg-zinc-100"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Close
          </button>
        </div>

        {draft.status === "posted" && draft.xPostId ? (
          <p className="mt-4 text-xs font-medium text-emerald-700">
            Posted: {draft.xPostId}
          </p>
        ) : null}

        {draft.variants.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Generating variants...</p>
        ) : (
          <div className="mt-4 grid gap-2">
            <p className="text-sm font-medium text-zinc-900">
              Choose a variant
            </p>
            {draft.variants.map((variant) => (
              <button
                className="border border-black/10 p-3 text-left text-sm leading-6 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="mt-4 min-h-32 w-full resize-y border border-black/20 p-3 text-sm leading-6 outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-zinc-50"
          disabled={draft.status !== "draft"}
          maxLength={280}
          onChange={(event) => onTextChange(event.target.value)}
          value={selectedText}
        />
        <p className="mt-1 text-xs text-zinc-500">{selectedText.length}/280</p>

        <div className="mt-4 grid gap-3">
          <label className="block text-sm">
            <span className="font-medium text-zinc-900">Optional image</span>
            <input
              accept="image/png,image/jpeg,image/webp"
              className="mt-2 block w-full text-sm"
              disabled={draft.status !== "draft" || isUploading}
              onChange={(event) =>
                onUpload(event.currentTarget.files?.[0] ?? null)
              }
              type="file"
            />
          </label>
          <p className="text-xs text-zinc-500">
            {draft.mediaId
              ? `Attached media ${draft.mediaId}.`
              : "Text-only remains ready."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
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
          <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
            {error}
          </div>
        ) : null}
      </article>
    </div>
  );
}

function trapDialogFocus(event: KeyboardEvent, dialog: HTMLElement | null) {
  if (dialog === null) {
    return;
  }

  const focusableElements = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));

  if (focusableElements.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function XAccountPanel() {
  const status = useQuery(api.x.connectionStatus);
  const startConnection = useAction(api.x.startConnection);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnectX() {
    setIsConnecting(true);
    setError(null);

    try {
      const connection = await startConnection({});
      window.location.assign(connection.url);
    } catch (err) {
      setError(errorMessage(err, "X connection failed. Try again."));
      setIsConnecting(false);
    }
  }

  return (
    <section className="border border-black/10 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">X account</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            Connect X account
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
            Dispatch posts approved drafts through your connected X account.
          </p>
        </div>
        <button
          className="h-10 w-fit border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === undefined || isConnecting}
          onClick={() => void handleConnectX()}
          type="button"
        >
          {isConnecting ? "Connecting..." : "Connect X account"}
        </button>
      </div>

      {status === undefined ? (
        <p className="mt-4 text-sm text-zinc-500">Checking X account...</p>
      ) : status.connected ? (
        <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-medium text-emerald-800">Connected</p>
          <p className="mt-1 text-emerald-950">
            {status.username ? `@${status.username}` : "Ready to post to X."}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-600">
          No X account connected yet.
        </p>
      )}

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p className="font-medium">X connection needs attention.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}
    </section>
  );
}

function GitHubRepoPanel() {
  const connection = useQuery(api.github.connectedRepos);
  const completeInstallation = useAction(api.github.completeInstallation);
  const connectInstalledRepository = useAction(
    api.github.connectInstalledRepository,
  );
  const processedInstallationId = useRef<string | null>(null);
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);
  const [isCompletingInstallation, setIsCompletingInstallation] =
    useState(false);
  const [connectingRepoId, setConnectingRepoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get("installation_id");

    if (!installationId || processedInstallationId.current === installationId) {
      return;
    }

    processedInstallationId.current = installationId;
    setIsCompletingInstallation(true);
    setError(null);

    void completeInstallation({ installationId })
      .then((result) => {
        if (result.kind === "selectionRequired") {
          setPendingSelection({
            installationId,
            repositories: result.repositories,
          });
          return;
        }

        setPendingSelection(null);
        clearInstallationQueryParams();
      })
      .catch((err) => {
        setError(errorMessage(err));
      })
      .finally(() => {
        setIsCompletingInstallation(false);
      });
  }, [completeInstallation]);

  async function handleConnectInstalledRepository(githubRepoId: string) {
    if (pendingSelection === null) {
      return;
    }

    setConnectingRepoId(githubRepoId);
    setError(null);

    try {
      await connectInstalledRepository({
        installationId: pendingSelection.installationId,
        githubRepoId,
      });
      setPendingSelection(null);
      clearInstallationQueryParams();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setConnectingRepoId(null);
    }
  }

  const repoCount = connection?.repoCount ?? 0;
  const repoLimit = connection?.repoLimit ?? 0;
  const canConnectMore = connection?.canConnectMore ?? false;
  const installUrl = connection?.installUrl ?? "";
  const repos = connection?.repos ?? [];
  const canOpenInstallUrl =
    connection !== undefined &&
    connection !== null &&
    canConnectMore &&
    !isCompletingInstallation &&
    installUrl.length > 0;

  return (
    <section className="border border-black/10 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">GitHub repo</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            Connect GitHub repos
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
            Dispatch watches selected repositories through the GitHub App push
            webhook.
          </p>
        </div>
        {canOpenInstallUrl ? (
          <a
            className="flex h-10 w-fit items-center border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            href={installUrl}
          >
            Install GitHub App
          </a>
        ) : (
          <button
            className="h-10 w-fit border border-black bg-black px-4 text-sm font-medium text-white opacity-60 disabled:cursor-not-allowed"
            disabled
            type="button"
          >
            {isCompletingInstallation ? "Connecting..." : "Install GitHub App"}
          </button>
        )}
      </div>

      {connection === undefined ? (
        <p className="mt-4 text-sm text-zinc-500">
          Checking connected repos...
        </p>
      ) : connection ? (
        <div className="mt-4 grid gap-3">
          <div className="flex flex-col gap-2 border border-black/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-zinc-900">
                {repoCount}/{repoLimit} repos connected
              </p>
              <p className="mt-1 text-zinc-600">
                {connection.plan === "good"
                  ? "Good includes 1 connected repo."
                  : "Better includes up to 5 connected repos."}
              </p>
            </div>
            {!canConnectMore && connection.plan === "good" ? (
              <p className="text-sm font-medium text-zinc-900">
                Upgrade to Better to connect more repos.
              </p>
            ) : null}
          </div>

          {repos.length > 0 ? (
            <div className="grid gap-2">
              {repos.map((repo) => (
                <ConnectedRepoRow key={repo.githubRepoId} repo={repo} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">
              No repositories connected yet.
            </p>
          )}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p className="font-medium">GitHub connection needs attention.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {pendingSelection !== null ? (
        <div className="mt-4 grid gap-2">
          <p className="text-sm font-medium text-zinc-900">
            Choose one installed repository
          </p>
          {pendingSelection.repositories.map((repo: RepositoryOption) => (
            <div
              className="flex flex-col gap-3 border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              key={repo.githubRepoId}
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">
                  {repo.fullName}
                </p>
                <a
                  className="mt-1 block break-words text-xs text-zinc-500 underline"
                  href={repo.htmlUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {repo.private ? "Private" : "Public"} repository
                </a>
              </div>
              <button
                className="h-10 w-fit border border-black px-4 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={connectingRepoId !== null || !canConnectMore}
                onClick={() =>
                  void handleConnectInstalledRepository(repo.githubRepoId)
                }
                type="button"
              >
                {connectingRepoId === repo.githubRepoId
                  ? "Connecting..."
                  : "Connect"}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ConnectedRepoRow({ repo }: { repo: ConnectedRepository }) {
  return (
    <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm">
      <p className="font-medium text-emerald-800">Connected</p>
      <a
        className="mt-1 block break-words text-emerald-950 underline"
        href={repo.htmlUrl}
        rel="noreferrer"
        target="_blank"
      >
        {repo.fullName}
      </a>
    </div>
  );
}

function clearInstallationQueryParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("installation_id");
  url.searchParams.delete("setup_action");
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(timestamp);
}

function errorMessage(
  error: unknown,
  fallback = "GitHub connection failed. Reinstall the GitHub App and try again.",
) {
  return error instanceof Error
    ? error.message
    : fallback;
}
