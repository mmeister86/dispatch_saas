"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { GitHubRepoPanel } from "@/components/settings-workspace";
import { api } from "@/convex/_generated/api";

type VoiceProfile = {
  summary: string;
  rules: string[];
  source: "x_import" | "manual_paste";
  sampleCount: number;
  confirmedAt: number | null;
  updatedAt: number;
};

type ConnectedRepository = {
  githubRepoId: string;
  fullName: string;
};

export function OnboardingWorkspace() {
  const router = useRouter();
  const access = useQuery(api.billing.currentAccess);
  const onboardingStatus = useQuery(api.onboarding.status);
  const xStatus = useQuery(api.x.connectionStatus);
  const githubConnection = useQuery(api.github.connectedRepos);
  const startXConnection = useAction(api.x.startConnection);
  const calibrateFromX = useAction(api.onboarding.calibrateFromX);
  const calibrateFromPosts = useAction(api.onboarding.calibrateFromPosts);
  const updateVoiceProfileDraft = useMutation(api.onboarding.updateVoiceProfileDraft);
  const rejectVoiceProfile = useMutation(api.onboarding.rejectVoiceProfile);
  const confirmVoiceProfile = useMutation(api.onboarding.confirmVoiceProfile);
  const importRecentCommitDrafts = useAction(
    api.onboarding.importRecentCommitDrafts,
  );
  const [manualPosts, setManualPosts] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [isConnectingX, setIsConnectingX] = useState(false);
  const [isImportingVoice, setIsImportingVoice] = useState(false);
  const [isCalibratingManual, setIsCalibratingManual] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isRejectingProfile, setIsRejectingProfile] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const repos = useMemo(
    () => githubConnection?.repos ?? [],
    [githubConnection?.repos],
  );
  const selectedRepo = useMemo(
    () =>
      repos.find((repo) => repo.githubRepoId === selectedRepoId) ?? repos[0],
    [repos, selectedRepoId],
  );
  const voiceProfile =
    onboardingStatus?.state === "onboarding"
      ? onboardingStatus.voiceProfile
      : null;
  const firstDraft =
    onboardingStatus?.state === "onboarding"
      ? onboardingStatus.firstDraft
      : null;

  async function handleImportFromX() {
    setIsImportingVoice(true);
    setNotice(null);
    setError(null);

    try {
      await calibrateFromX({});
      setNotice("Voice profile imported from your recent X posts.");
    } catch (err) {
      setError(errorMessage(err, "X import failed. Paste 3-5 posts instead."));
    } finally {
      setIsImportingVoice(false);
    }
  }

  async function handleConnectX() {
    setIsConnectingX(true);
    setNotice(null);
    setError(null);

    try {
      const connection = await startXConnection({
        returnPath: "/dashboard/onboarding",
      });
      window.location.assign(connection.url);
    } catch (err) {
      setError(errorMessage(err, "X connection failed. Try again."));
      setIsConnectingX(false);
    }
  }

  async function handleManualCalibration() {
    const posts = manualPosts
      .split(/\n\s*\n/)
      .map((post) => post.trim())
      .filter(Boolean);

    setIsCalibratingManual(true);
    setNotice(null);
    setError(null);

    try {
      await calibrateFromPosts({ posts });
      setNotice("Voice profile created from pasted posts.");
    } catch (err) {
      setError(errorMessage(err, "Paste 3-5 posts to calibrate your voice."));
    } finally {
      setIsCalibratingManual(false);
    }
  }

  async function handleConfirmProfile() {
    setIsConfirming(true);
    setNotice(null);
    setError(null);

    try {
      await confirmVoiceProfile({});
      setNotice("Voice profile confirmed.");
    } catch (err) {
      setError(errorMessage(err, "Confirming your voice profile failed."));
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleUpdateProfile({
    rules,
    summary,
  }: {
    rules: string[];
    summary: string;
  }) {
    setIsUpdatingProfile(true);
    setNotice(null);
    setError(null);

    try {
      await updateVoiceProfileDraft({ summary, rules });
      setNotice("Voice profile updated.");
    } catch (err) {
      setError(errorMessage(err, "Updating your voice profile failed."));
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function handleRejectProfile() {
    setIsRejectingProfile(true);
    setNotice(null);
    setError(null);

    try {
      await rejectVoiceProfile({});
      setNotice("Voice profile rejected. Import from X or paste posts again.");
    } catch (err) {
      setError(errorMessage(err, "Rejecting your voice profile failed."));
    } finally {
      setIsRejectingProfile(false);
    }
  }

  async function handleCreateDraft(repo: ConnectedRepository) {
    setIsCreatingDraft(true);
    setNotice(null);
    setError(null);

    try {
      const result = await importRecentCommitDrafts({
        githubRepoId: repo.githubRepoId,
      });
      setNotice(`${result.drafts.length} drafts generated from recent commits.`);
      router.push("/dashboard/drafts");
    } catch (err) {
      setError(errorMessage(err, "Creating the first draft failed."));
    } finally {
      setIsCreatingDraft(false);
    }
  }

  if (
    access === undefined ||
    onboardingStatus === undefined ||
    xStatus === undefined ||
    githubConnection === undefined
  ) {
    return (
      <section className="flex min-h-[420px] items-center justify-center">
        <p className="text-sm font-medium text-zinc-500">
          Loading onboarding...
        </p>
      </section>
    );
  }

  if (access.state !== "active" || onboardingStatus.state !== "onboarding") {
    return (
      <section className="flex min-h-[420px] items-center justify-center">
        <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm font-semibold text-emerald-700">Onboarding</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
            Subscribe before onboarding.
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Dispatch needs an active subscription before it can import posts,
            connect repositories, and generate your first draft.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            href="/"
          >
            Back to workspace
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="border-b border-zinc-200 pb-5">
        <p className="text-sm font-semibold text-emerald-700">Onboarding</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">
          Teach Dispatch your voice, then generate your first draft.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Import or paste a few posts, confirm the derived style profile, then
          create real drafts from recent commits in a connected repo.
        </p>
      </header>

      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5">
        <StepHeader
          label="Step 1"
          ready={Boolean(voiceProfile?.confirmedAt)}
          title="Calibrate your voice"
        />

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-950">Import from X</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Dispatch reads up to 20 of your own recent posts and stores only
              the derived writing profile.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  !xStatus.connected || isImportingVoice || isCalibratingManual
                }
                onClick={() => void handleImportFromX()}
                type="button"
              >
                {isImportingVoice ? "Importing..." : "Import from X"}
              </button>
              {!xStatus.connected ? (
                <button
                  className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isConnectingX}
                  onClick={() => void handleConnectX()}
                  type="button"
                >
                  {isConnectingX ? "Connecting..." : "Connect X"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-950">
              Paste 3-5 posts
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Use posts that already sound like you. Separate each post with a
              blank line.
            </p>
            <textarea
              className="mt-4 min-h-36 w-full resize-y rounded-md border border-zinc-300 bg-white p-3 text-sm leading-6 outline-none transition-colors focus:border-zinc-950"
              onChange={(event) => setManualPosts(event.target.value)}
              placeholder={"Post one...\n\nPost two...\n\nPost three..."}
              value={manualPosts}
            />
            <button
              className="mt-3 h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCalibratingManual || isImportingVoice}
              onClick={() => void handleManualCalibration()}
              type="button"
            >
              {isCalibratingManual ? "Calibrating..." : "Create profile"}
            </button>
          </div>
        </div>

        {voiceProfile ? (
          <VoiceProfileCard
            isBusy={
              isImportingVoice ||
              isUpdatingProfile ||
              isRejectingProfile ||
              isConfirming
            }
            isConfirming={isConfirming}
            isRejecting={isRejectingProfile}
            isUpdating={isUpdatingProfile}
            key={voiceProfile.updatedAt}
            onConfirm={() => void handleConfirmProfile()}
            onRegenerateFromX={() => void handleImportFromX()}
            onReject={() => void handleRejectProfile()}
            onUpdate={(input) => void handleUpdateProfile(input)}
            profile={voiceProfile}
          />
        ) : null}
      </section>

      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5">
        <StepHeader
          label="Step 2"
          ready={Boolean(firstDraft)}
          title="Generate your first draft"
        />

        {repos.length === 0 ? (
          <GitHubRepoPanel
            installReturnPath="/dashboard/onboarding"
            variant="embedded"
          />
        ) : (
          <div className="grid gap-3">
            <label className="text-sm font-semibold text-zinc-950" htmlFor="repo">
              Repository
            </label>
            <select
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition-colors focus:border-zinc-950 sm:max-w-md"
              id="repo"
              onChange={(event) => setSelectedRepoId(event.target.value)}
              value={selectedRepo?.githubRepoId ?? ""}
            >
              {repos.map((repo) => (
                <option key={repo.githubRepoId} value={repo.githubRepoId}>
                  {repo.fullName}
                </option>
              ))}
            </select>
            <button
              className="h-10 w-fit rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                !voiceProfile?.confirmedAt || !selectedRepo || isCreatingDraft
              }
              onClick={() =>
                selectedRepo ? void handleCreateDraft(selectedRepo) : undefined
              }
              type="button"
            >
              {isCreatingDraft ? "Generating..." : "Generate first drafts"}
            </button>
          </div>
        )}

        {firstDraft ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-semibold">First draft is ready.</p>
            <p className="mt-1">{firstDraft.repoFullName}</p>
            <Link
              className="mt-3 inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              href="/dashboard/drafts"
            >
              Open first draft
            </Link>
          </div>
        ) : null}
      </section>

      {notice ? (
        <div
          aria-live="polite"
          className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p className="font-medium">Onboarding needs attention.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}
    </div>
  );
}

function StepHeader({
  label,
  ready,
  title,
}: {
  label: string;
  ready: boolean;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-normal text-zinc-950">
          {title}
        </h2>
      </div>
      <p
        className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${
          ready
            ? "bg-emerald-100 text-emerald-800"
            : "bg-zinc-100 text-zinc-600"
        }`}
      >
        {ready ? "Ready" : "Needs setup"}
      </p>
    </div>
  );
}

function VoiceProfileCard({
  isBusy,
  isConfirming,
  isRejecting,
  isUpdating,
  onConfirm,
  onRegenerateFromX,
  onReject,
  onUpdate,
  profile,
}: {
  isBusy: boolean;
  isConfirming: boolean;
  isRejecting: boolean;
  isUpdating: boolean;
  onConfirm: () => void;
  onRegenerateFromX: () => void;
  onReject: () => void;
  onUpdate: (input: { summary: string; rules: string[] }) => void;
  profile: VoiceProfile;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(profile.summary);
  const [rulesDraft, setRulesDraft] = useState(profile.rules.join("\n"));
  const canEdit = profile.confirmedAt === null;
  const rules = rulesDraft
    .split("\n")
    .map((rule) => rule.trim())
    .filter(Boolean);

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-950">
            Derived voice profile
          </p>
          {isEditing ? (
            <label className="mt-3 grid gap-2 text-sm font-medium text-zinc-700">
              Summary
              <textarea
                className="min-h-24 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm font-normal leading-6 text-zinc-950 outline-none transition-colors focus:border-zinc-950"
                onChange={(event) => setSummaryDraft(event.target.value)}
                value={summaryDraft}
              />
            </label>
          ) : (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              {profile.summary}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            className="h-10 w-fit rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canEdit || isBusy}
            onClick={onRegenerateFromX}
            type="button"
          >
            Regenerate from X
          </button>
          <button
            className="h-10 w-fit rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canEdit || isBusy}
            onClick={() => setIsEditing((current) => !current)}
            type="button"
          >
            {isEditing ? "Cancel edit" : "Edit profile"}
          </button>
          <button
            className="h-10 w-fit rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canEdit || isBusy}
            onClick={onReject}
            type="button"
          >
            {isRejecting ? "Rejecting..." : "Reject profile"}
          </button>
          <button
            className="h-10 w-fit rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={profile.confirmedAt !== null || isBusy}
            onClick={onConfirm}
            type="button"
          >
            {profile.confirmedAt
              ? "Confirmed"
              : isConfirming
                ? "Confirming..."
                : "Confirm profile"}
          </button>
        </div>
      </div>
      {isEditing ? (
        <div className="mt-3 grid gap-3">
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Rules
            <textarea
              className="min-h-36 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm font-normal leading-6 text-zinc-950 outline-none transition-colors focus:border-zinc-950"
              onChange={(event) => setRulesDraft(event.target.value)}
              value={rulesDraft}
            />
          </label>
          <button
            className="h-10 w-fit rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy || rules.length === 0}
            onClick={() => {
              onUpdate({ summary: summaryDraft, rules });
              setIsEditing(false);
            }}
            type="button"
          >
            {isUpdating ? "Saving..." : "Save changes"}
          </button>
        </div>
      ) : (
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
          {profile.rules.map((rule) => (
            <li className="rounded-md bg-zinc-50 px-3 py-2" key={rule}>
              {rule}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs font-medium text-zinc-500">
        {profile.source === "x_import" ? "Imported from X" : "Manual paste"} -{" "}
        {profile.sampleCount} posts analyzed
      </p>
    </div>
  );
}

function errorMessage(err: unknown, fallback = "Something went wrong.") {
  return err instanceof Error && err.message.length > 0
    ? err.message
    : fallback;
}
