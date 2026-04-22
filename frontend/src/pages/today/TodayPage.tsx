import { useState, useEffect, useRef } from "preact/hooks";
import {
  Pencil,
  RefreshCw,
  Camera,
  X,
  Zap,
  Sparkles,
  Sprout,
  Heart,
} from "lucide-preact";
import { clsx as cn } from "clsx";
import { Button } from "../../components/Button/Button";
import { MediaPreview } from "../../components/MediaPreview/MediaPreview";
import { TreeVisual } from "../../components/TreeVisual/TreeVisual";
import type { SavedMemory, PastMemory } from "./today.types";
import type { TreeData } from "../tree/tree.types";
import type { MemoryStats } from "../memories/memories.types";
import { api, getApiErrorMessage, validateMemoryMediaFile } from "../../lib/api";
import { getRelativeLabel, getFormattedDate } from "../../lib/date";

const MAX_CHARS = 180;
const PROMPT_RETRY_DELAY_MS = 1500;
const PROMPT_MAX_RETRIES = 60;

function getTodayString() {
  return new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();
}

function PromptSkeleton() {
  return (
    <div className="h-[4.8rem] flex flex-col justify-center gap-2.5">
      <div className="h-4 w-11/12 rounded-full bg-white/65 animate-pulse" />
      <div className="h-4 w-4/5 rounded-full bg-white/50 animate-pulse" />
      <div className="h-4 w-2/3 rounded-full bg-white/35 animate-pulse" />
    </div>
  );
}

function PromptCard({
  prompt,
  isLoading,
  error,
  onRefresh,
}: {
  prompt: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-blue rounded-3xl p-8 flex flex-col gap-5">
      {isLoading ? (
        <PromptSkeleton />
      ) : (
        <h2 className="text-3xl font-black leading-tight h-[4.8rem] flex items-center text-darkgrey">
          {prompt ?? error ?? " "}
        </h2>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 bg-white rounded-full px-4 py-2 text-sm font-semibold text-darkgrey w-fit hover:shadow-md transition-shadow"
      >
        <RefreshCw size={14} />
        {isLoading ? "Generating…" : "Need inspiration?"}
      </button>
    </div>
  );
}

function EntryCard({
  dateStr,
  content,
  media,
  error,
  saving,
  uploadProgress,
  onContentChange,
  onMediaChange,
  onMediaRemove,
  onCapsul,
  onCancel,
}: {
  dateStr: string;
  content: string;
  media: string | null;
  error: string | null;
  saving: boolean;
  uploadProgress: number | null;
  onContentChange: (v: string) => void;
  onMediaChange: (e: Event) => void;
  onMediaRemove: () => void;
  onCapsul: () => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasContent = content.trim().length > 0;

  return (
    <div className="bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-darkgrey tracking-widest">
          {dateStr}
        </span>
        {hasContent && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-mediumgrey hover:text-darkgrey transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <textarea
        value={content}
        onInput={(e) =>
          onContentChange((e.target as HTMLTextAreaElement).value)
        }
        placeholder="Type your memory here..."
        maxLength={MAX_CHARS}
        rows={5}
        className="w-full bg-transparent outline-none text-darkgrey placeholder:text-mediumgrey text-base resize-none leading-relaxed"
      />

      {media && (
        <div className="relative rounded overflow-hidden">
          <MediaPreview
            src={media}
            alt="Attached"
            className="w-full max-h-64 rounded object-cover"
          />
          <button
            type="button"
            onClick={onMediaRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <X size={14} className="text-darkgrey" />
          </button>
        </div>
      )}

      {uploadProgress !== null && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-darkgrey">
            <span>Uploading media</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-lightgrey overflow-hidden">
            <div
              className="h-full rounded-full bg-pink transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-pink">{error}</p>}

      <div className="flex items-center gap-3 pt-2 border-t border-black/5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*"
          className="hidden"
          onChange={onMediaChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            media
              ? "bg-pink text-white"
              : "bg-verylightorange text-mediumgrey hover:text-darkgrey",
          )}
        >
          <Camera size={18} />
        </button>

        <span className="text-sm text-mediumgrey">
          {content.length}/{MAX_CHARS}
        </span>

        <div className="flex-1" />

        <Button
          variant="primary"
          size="sm"
          disabled={!hasContent || saving}
          onClick={onCapsul}
        >
          {saving ? "Saving…" : "Capsul it!"}
        </Button>
      </div>
    </div>
  );
}

function SavedEntryCard({
  dateStr,
  memory,
  onEdit,
}: {
  dateStr: string;
  memory: SavedMemory;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-darkgrey tracking-widest">
          {dateStr}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-sm text-mediumgrey hover:text-darkgrey transition-colors font-medium"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>

      <p className="text-darkgrey text-lg font-semibold leading-relaxed">
        {memory.content}
      </p>

      {memory.media && (
        <MediaPreview
          src={memory.media}
          alt="Memory"
          className="rounded-2xl w-full max-h-64 object-cover"
        />
      )}
    </div>
  );
}

function SuccessBanner() {
  return (
    <div className="bg-white rounded-3xl px-7 py-5 flex flex-col items-center gap-2 shadow-sm text-center">
      <div className="flex items-center gap-2">
        <Heart size={16} className="text-lightpink" fill="currentColor" />
        <span className="font-bold text-darkgrey">
          Memory safely stored in your capsul!
        </span>
      </div>
      <p className="text-mediumgrey text-sm">
        Come back tomorrow to keep your tree growing 🌱
      </p>
    </div>
  );
}

function PastMemoryCard({
  memory,
  onRefresh,
  canRefresh,
}: {
  memory: PastMemory | null;
  onRefresh: () => void;
  canRefresh: boolean;
}) {
  if (!memory) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-orange/50 p-6 flex flex-col items-center gap-2 text-center">
        <p className="text-mediumgrey text-sm leading-relaxed">
          Keep adding memories — they'll resurface here as reminders of your
          past.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-orange rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          disabled={!canRefresh}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
            canRefresh
              ? "bg-white/40 hover:bg-white/60"
              : "bg-white/25 text-darkgrey/40 cursor-default",
          )}
          aria-label="Show another memory"
        >
          <RefreshCw size={15} className="text-darkgrey" />
        </button>
        <div>
          <p className="font-bold text-darkgrey text-base">
            {getRelativeLabel(memory.date, { showAnniversary: true })}
          </p>
          <p className="text-xs text-darkgrey/60 tracking-widest font-semibold">
            {getFormattedDate(memory.date, { format: "long" })}
          </p>
          <p className="text-xs text-darkgrey/50 mt-0.5">Mood: {memory.mood}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <p className="text-darkgrey text-sm leading-relaxed">
          {memory.content}
        </p>
      </div>
    </div>
  );
}

function TreeSidebar({
  tree,
  stats,
  saved,
}: {
  tree: TreeData | null;
  stats: MemoryStats | null;
  saved: boolean;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
      <div className="text-center">
        <h3 className="font-bold text-darkgrey text-lg">My Tree</h3>
      </div>

      <div className="bg-linear-to-b from-blue/40 via-blue/20 to-blue/5 rounded-2xl p-4 flex items-center justify-center">
        <TreeVisual
          health={tree?.lifeForce ?? 0}
          size="medium"
          isDecreasing={tree?.isDecreasing ?? false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-darkgrey">
          <span>Life Force</span>
          <span className="text-pink">{tree?.lifeForce ?? 0}%</span>
        </div>
        <p className="text-xs text-mediumgrey">
          {tree?.stageLabel ?? "Dormant Seed"}
          {tree?.isDecreasing ? " · Needs a new memory" : " · Growing steadily"}
        </p>
        <div className="h-2 bg-lightgrey rounded-full overflow-hidden">
          <div
            className="h-full bg-pink rounded-full transition-all duration-1000"
            style={{ width: `${tree?.lifeForce ?? 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange/80 rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center">
          <div className="w-7 h-7 bg-white/60 rounded-full flex items-center justify-center">
            <Zap size={13} className="text-darkgrey" />
          </div>
          <span className="text-2xl font-black text-darkgrey">
            {stats?.dayStreak ?? 0}
          </span>
          <span className="text-[10px] font-bold text-mediumgrey tracking-widest">
            DAY STREAK
          </span>
        </div>
        <div className="bg-blue/80 rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center">
          <div className="w-7 h-7 bg-white/60 rounded-full flex items-center justify-center">
            <Sparkles size={13} className="text-darkgrey" />
          </div>
          <span className="text-2xl font-black text-darkgrey">
            {stats?.wordsWritten ?? 0}
          </span>
          <span className="text-[10px] font-bold text-mediumgrey tracking-widest">
            WORDS WRITTEN
          </span>
        </div>
      </div>

      <div
        className={cn(
          "border-2 rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center transition-colors duration-500",
          saved
            ? "border-pink/20 bg-verylightorange"
            : "border-dashed border-lightgrey",
        )}
      >
        <Sprout
          size={18}
          className={cn(saved ? "text-pink" : "text-mediumgrey")}
        />
        <span
          className={cn(
            "text-sm font-semibold",
            saved ? "text-pink" : "text-mediumgrey",
          )}
        >
          {saved ? "Memory added today" : "Capsul a memory to grow!"}
        </span>
      </div>
    </div>
  );
}

type RawMemory = {
  id: string;
  date: string;
  content: string;
  mood: string | null;
  media: { url: string }[];
};

type RawReminder = {
  id: string;
  date: string;
  content: string;
  mood: string | null;
};

type RawPromptResponse = {
  prompt: string;
};

function toPastMemory(raw: RawReminder): PastMemory {
  return {
    id: raw.id,
    date: raw.date.slice(0, 10),
    content: raw.content,
    media: null,
    mood: (raw.mood ?? "Neutral") as PastMemory["mood"],
  };
}

export function TodayPage() {
  const [todayState, setTodayState] = useState<"prompt" | "saved">("prompt");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(true);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [savedMemory, setSavedMemory] = useState<SavedMemory | null>(null);
  const [capsuls, setCapsuls] = useState<PastMemory[]>([]);
  const [capsulIdx, setCapsulIdx] = useState(0);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const mediaFileRef = useRef<File | null>(null);
  const promptRequestIdRef = useRef(0);

  const dateStr = getTodayString();

  useEffect(
    () => () => {
      promptRequestIdRef.current += 1;
    },
    [],
  );

  const loadNextPrompt = async () => {
    const requestId = ++promptRequestIdRef.current;
    setPromptLoading(true);
    setPrompt(null);
    setPromptError(null);

    try {
      for (let attempt = 0; attempt < PROMPT_MAX_RETRIES; attempt += 1) {
        try {
          const next = await api.get<RawPromptResponse>("/memories/prompts");
          if (promptRequestIdRef.current !== requestId) return;
          setPrompt(next.prompt);
          return;
        } catch (error) {
          if (
            (error as { status?: number })?.status === 503 &&
            attempt < PROMPT_MAX_RETRIES - 1
          ) {
            await new Promise((resolve) =>
              setTimeout(resolve, PROMPT_RETRY_DELAY_MS),
            );
            if (promptRequestIdRef.current !== requestId) return;
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      if (promptRequestIdRef.current !== requestId) return;
      if ((error as { status?: number })?.status === 503) {
        setPromptError(
          "Inspiration is taking longer than expected. Try again in a moment.",
        );
      } else {
        setPromptError(
          getApiErrorMessage(
            error,
            "We could not generate inspiration right now.",
          ),
        );
      }
    } finally {
      if (promptRequestIdRef.current === requestId) {
        setPromptLoading(false);
      }
    }
  };

  useEffect(() => {
    async function load() {
      const [tree, st, todayMem] = await Promise.all([
        api.get<TreeData | null>("/users/me/tree").catch(() => null),
        api.get<MemoryStats>("/memories/stats").catch(() => null),
        api
          .get<RawMemory>("/memories/today")
          .catch((err: { status?: number }) =>
            err?.status === 404 ? null : null,
          ),
      ]);

      setTreeData(
        tree ?? {
          lifeForce: 0,
          isDecreasing: false,
          stage: 1,
          stageLabel: "Dormant Seed",
          lastMemoryDate: null,
        },
      );
      setStats(st);

      if (todayMem) {
        setPromptLoading(false);
        setSavedMemory({
          id: todayMem.id,
          content: todayMem.content,
          media: todayMem.media[0]?.url ?? null,
        });
        await loadReminders();
        setTodayState("saved");
        setBootstrapped(true);
        return;
      }

      await loadNextPrompt();
      setBootstrapped(true);
    }
    void load();
  }, []);

  const loadReminders = async () => {
    const raw = await api
      .get<RawReminder[]>("/memories/reminders")
      .catch(() => [] as RawReminder[]);
    const mapped = raw.map(toPastMemory);
    setCapsuls(mapped);
    setCapsulIdx(0);
    return mapped;
  };

  useEffect(() => {
    if (todayState === "saved" && capsuls.length === 0) {
      void loadReminders();
    }
  }, [todayState]);

  useEffect(() => {
    if (
      bootstrapped &&
      todayState === "prompt" &&
      !promptLoading &&
      prompt === null &&
      promptError === null
    ) {
      void loadNextPrompt();
    }
  }, [bootstrapped, todayState, prompt, promptLoading, promptError]);

  const pastMemory = capsuls[capsulIdx] ?? null;

  const handleRefreshPastMemory = () => {
    if (capsuls.length < 2) return;
    setCapsulIdx((prev) => (prev + 1) % capsuls.length);
  };

  const handleContentChange = (v: string) => {
    if (v.length <= MAX_CHARS) {
      setContent(v);
      if (saveError) setSaveError(null);
    }
  };

  const handleMediaChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const mediaError = validateMemoryMediaFile(file);
    if (mediaError) {
      mediaFileRef.current = null;
      setSaveError(mediaError);
      setMedia(savedMemory?.media ?? null);
      input.value = "";
      return;
    }
    setSaveError(null);
    mediaFileRef.current = file;
    const reader = new FileReader();
    reader.onload = (ev) => setMedia(ev.target?.result as string);
    reader.readAsDataURL(file);
    input.value = "";
  };

  const handleCapsul = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      let memId: string;
      let mediaError: string | null = null;
      if (savedMemory?.id) {
        await api.patch(`/memories/${savedMemory.id}`, { content });
        memId = savedMemory.id;
      } else {
        const mem = await api.post<RawMemory>("/memories", { content });
        memId = mem.id;
      }
      if (mediaFileRef.current) {
        const form = new FormData();
        form.append("file", mediaFileRef.current);
        try {
          setUploadProgress(0);
          await api.upload(`/memories/${memId}/media`, form, {
            onProgress: setUploadProgress,
          });
          setUploadProgress(100);
        } catch (error) {
          mediaError = getApiErrorMessage(error, "Failed to upload the file.");
          mediaFileRef.current = null;
        }
      } else if (savedMemory?.id && savedMemory.media && !media) {
        try {
          await api.delete(`/memories/${memId}/media`);
        } catch (error) {
          mediaError = getApiErrorMessage(error, "Failed to remove the image.");
        }
      }
      const [newTree, newStats, refreshedMemory] = await Promise.all([
        api.get<TreeData | null>("/users/me/tree").catch(() => null),
        api.get<MemoryStats>("/memories/stats").catch(() => null),
        api.get<RawMemory>(`/memories/${memId}`),
      ]);
      setTreeData(
        newTree ?? {
          lifeForce: 0,
          isDecreasing: false,
          stage: 1,
          stageLabel: "Dormant Seed",
          lastMemoryDate: null,
        },
      );
      setStats(newStats);
      setSavedMemory({
        id: refreshedMemory.id,
        content: refreshedMemory.content,
        media: refreshedMemory.media[0]?.url ?? null,
      });
      await loadReminders();

      if (mediaError) {
        setContent(refreshedMemory.content);
        setMedia(refreshedMemory.media[0]?.url ?? null);
        setSaveError(mediaError);
        setTodayState("prompt");
        return;
      }

      setTodayState("saved");
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Failed to save your memory."));
    } finally {
      setUploadProgress(null);
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (!savedMemory) return;
    setSaveError(null);
    setContent(savedMemory.content);
    setMedia(savedMemory.media);
    mediaFileRef.current = null;
    setTodayState("prompt");
  };

  const handleCancel = () => {
    setSaveError(null);
    setContent("");
    setMedia(null);
    mediaFileRef.current = null;
    if (savedMemory) setTodayState("saved");
  };

  const handleRefreshPrompt = async () => {
    if (promptLoading) return;
    await loadNextPrompt();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-12 items-center">
        <div className="flex flex-col gap-6 lg:gap-8">
          {todayState === "prompt" && (
            <>
              <PromptCard
                prompt={prompt}
                isLoading={promptLoading}
                error={promptError}
                onRefresh={handleRefreshPrompt}
              />
              <EntryCard
                dateStr={dateStr}
                content={content}
                media={media}
                error={saveError}
                saving={saving}
                uploadProgress={uploadProgress}
                onContentChange={handleContentChange}
                onMediaChange={handleMediaChange}
                onMediaRemove={() => {
                  setMedia(null);
                  mediaFileRef.current = null;
                  setUploadProgress(null);
                  setSaveError(null);
                }}
                onCapsul={handleCapsul}
                onCancel={handleCancel}
              />
            </>
          )}

          {todayState === "saved" && savedMemory && (
            <>
              <SavedEntryCard
                dateStr={dateStr}
                memory={savedMemory}
                onEdit={handleEdit}
              />
              <SuccessBanner />
              <PastMemoryCard
                memory={pastMemory}
                onRefresh={handleRefreshPastMemory}
                canRefresh={capsuls.length > 1}
              />
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-20">
          <TreeSidebar
            tree={treeData}
            stats={stats}
            saved={todayState === "saved"}
          />
        </div>
      </div>
    </div>
  );
}
