import { useState, useEffect, useRef } from 'preact/hooks';
import { Pencil, RefreshCw, Camera, X, Zap, Sparkles, Sprout, Activity, Heart } from 'lucide-preact';
import { Button } from '../../components/Button/Button';

const MAX_CHARS = 180;
const MOCK_HISTORICAL_WORDS = 0;

// to replace by IA generation
const DEFAULT_PROMPTS = [
  "What's something you're grateful for right now?",
  "What made you smile today?",
  "Describe a small moment that felt good.",
  "What's on your mind right now?",
  "What did you learn today?",
  "Who made your day better?",
  "What's one thing you want to remember about today?",
  "What surprised you today?",
];

interface SavedMemory {
  text: string;
  image: string | null;
}

const PAST_MEMORY = {
  date: 'MARCH 30, 2025',
  text: 'It was a lazy day today. Ordered pizza, watched a movie, and just relaxed. Much needed! 🍕🎬',
};

function getTodayString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function PromptCard({ prompt, onRefresh }: { prompt: string; onRefresh: () => void }) {
  const isLoading = prompt === '...';
  return (
    <div className="bg-blue rounded-3xl p-8 flex flex-col gap-5">
      <h2 className={`text-3xl font-black leading-tight ${isLoading ? 'text-darkgrey/30 animate-pulse' : 'text-darkgrey'}`}>
        {prompt}
      </h2>
      <button
        type="button"
        onClick={onRefresh}
        className="flex items-center gap-2 bg-white rounded-full px-4 py-2 text-sm font-semibold text-darkgrey w-fit hover:shadow-md transition-shadow"
      >
        <RefreshCw size={14} />
        Need inspiration?
      </button>
    </div>
  );
}

function EntryCard({
  dateStr, text, image,
  onTextChange, onImageChange, onImageRemove, onCapsul, onCancel,
}: {
  dateStr: string;
  text: string;
  image: string | null;
  onTextChange: (v: string) => void;
  onImageChange: (e: Event) => void;
  onImageRemove: () => void;
  onCapsul: () => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasContent = text.trim().length > 0;

  return (
    <div className="bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-sm">

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-darkgrey tracking-widest">{dateStr}</span>
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
        value={text}
        onInput={(e) => onTextChange((e.target as HTMLTextAreaElement).value)}
        placeholder="Type your memory here..."
        maxLength={MAX_CHARS}
        rows={5}
        className="w-full bg-transparent outline-none text-darkgrey placeholder:text-mediumgrey text-base resize-none leading-relaxed"
      />

      {image && (
        <div className="relative rounded-2xl overflow-hidden">
          <img src={image} alt="Attached" className="w-full max-h-64 object-cover" />
          <button
            type="button"
            onClick={onImageRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <X size={14} className="text-darkgrey" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-black/5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={[
            'w-10 h-10 rounded-full flex items-center justify-center transition-all',
            image
              ? 'bg-pink text-white'
              : 'bg-verylightorange text-mediumgrey hover:text-darkgrey',
          ].join(' ')}
        >
          <Camera size={18} />
        </button>

        <span className="text-sm text-mediumgrey">{text.length}/{MAX_CHARS}</span>

        <div className="flex-1" />

        <Button variant="primary" size="sm" disabled={!hasContent} onClick={onCapsul}>
          Capsul it!
        </Button>
      </div>
    </div>
  );
}

function SavedEntryCard({ dateStr, memory, onEdit }: {
  dateStr: string;
  memory: SavedMemory;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-darkgrey tracking-widest">{dateStr}</span>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-sm text-mediumgrey hover:text-darkgrey transition-colors font-medium"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>

      <p className="text-darkgrey text-lg font-semibold leading-relaxed">{memory.text}</p>

      {memory.image && (
        <img src={memory.image} alt="Memory" className="rounded-2xl w-full max-h-64 object-cover" />
      )}
    </div>
  );
}

function SuccessBanner() {
  return (
    <div className="bg-white rounded-3xl px-7 py-5 flex flex-col items-center gap-2 shadow-sm text-center">
      <div className="flex items-center gap-2">
        <Heart size={16} className="text-pink" fill="currentColor" />
        <span className="font-bold text-darkgrey">Memory safely stored in your capsul!</span>
      </div>
      <p className="text-mediumgrey text-sm">
        Your tree is thanking you for this beautiful moment. Come back tomorrow to keep it growing.
      </p>
    </div>
  );
}

function PastMemoryCard() {
  return (
    <div className="bg-orange rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/40 rounded-full flex items-center justify-center flex-shrink-0">
          <RefreshCw size={15} className="text-darkgrey" />
        </div>
        <div>
          <p className="font-bold text-darkgrey text-base">One year ago today</p>
          <p className="text-xs font-semibold text-darkgrey/60 tracking-widest">{PAST_MEMORY.date}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5">
        <p className="text-darkgrey text-sm leading-relaxed">{PAST_MEMORY.text}</p>
      </div>
    </div>
  );
}

function TreeSidebar({ saved, totalWords }: { saved: boolean; totalWords: number }) {
  const lifeForce = saved ? 10 : 0;

  return (
    <div className="bg-white rounded-3xl p-6 flex flex-col gap-5 shadow-sm">

      <div className="text-center">
        <h3 className="font-bold text-darkgrey text-lg">My Tree</h3>
        <p className="text-mediumgrey text-sm mt-0.5">
          {saved ? 'Growing strong today!' : 'Waiting for connection...'}
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-blue/50 to-blue/10 h-48 flex items-end justify-center">
        {saved && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4 text-xl pointer-events-none select-none">
            💗 💗
          </div>
        )}
        <div className="absolute bottom-0 w-36 h-12 bg-orange/40 rounded-t-full" />
        <Sprout
          size={68}
          strokeWidth={1.5}
          className={`relative z-10 mb-2 transition-colors duration-700 ${saved ? 'text-orange' : 'text-mediumgrey/40'}`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm font-semibold text-darkgrey">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-lightpink rounded-full flex items-center justify-center">
              <Activity size={12} className="text-pink" />
            </div>
            Life Force
          </div>
          <span>{lifeForce}%</span>
        </div>
        <div className="h-2 bg-lightgrey rounded-full overflow-hidden">
          <div
            className="h-full bg-pink rounded-full transition-all duration-1000"
            style={{ width: `${lifeForce}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange/30 rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center">
          <div className="w-7 h-7 bg-white/60 rounded-full flex items-center justify-center">
            <Zap size={13} className="text-darkgrey" />
          </div>
          <span className="text-2xl font-black text-darkgrey">1</span>
          <span className="text-[10px] font-bold text-mediumgrey tracking-widest">DAY STREAK</span>
        </div>
        <div className="bg-blue/40 rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center">
          <div className="w-7 h-7 bg-white/60 rounded-full flex items-center justify-center">
            <Sparkles size={13} className="text-darkgrey" />
          </div>
          <span className="text-2xl font-black text-darkgrey">{totalWords}</span>
          <span className="text-[10px] font-bold text-mediumgrey tracking-widest">WORDS WRITTEN</span>
        </div>
      </div>

      <div className={[
        'border-2 rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center transition-colors duration-500',
        saved ? 'border-pink/20 bg-verylightorange' : 'border-dashed border-lightgrey',
      ].join(' ')}>
        <Sprout size={18} className={saved ? 'text-pink' : 'text-mediumgrey'} />
        <span className={`text-sm font-semibold ${saved ? 'text-pink' : 'text-mediumgrey'}`}>
          {saved ? 'Memory added today' : 'Capsul a memory to grow!'}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FETCHING DU PROMPT
// ─────────────────────────────────────────────────────────────
// Cette fonction sera branchée sur l'API backend quand elle sera prête.
// En attendant, elle pioche dans DEFAULT_PROMPTS de façon aléatoire.
//
// Pour brancher l'IA plus tard, il suffira de remplacer le corps par :
//   const res = await fetch('http://localhost:3000/prompt');
//   const data = await res.json();
//   return data.prompt;
//
// Le reste de TodayPage n'a pas besoin de changer.
async function fetchPrompt(): Promise<string> {
  // TODO: remplacer par l'appel API quand le backend est prêt
  // const res = await fetch('/api/prompt');
  // const data = await res.json();
  // return data.prompt;
  return DEFAULT_PROMPTS[Math.floor(Math.random() * DEFAULT_PROMPTS.length)];
}

export function TodayPage() {
  const [todayState, setTodayState] = useState<'prompt' | 'saved'>('prompt');
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  // prompt est null pendant le chargement → on affiche un état "loading"
  const [prompt, setPrompt] = useState<string | null>(null);
  const [savedMemory, setSavedMemory] = useState<SavedMemory | null>(null);

  const dateStr = getTodayString();

  // Chargement initial du prompt au montage du composant.
  // useEffect avec [] = s'exécute une seule fois, équivalent de componentDidMount.
  // La fonction async est déclarée à l'intérieur car useEffect ne peut pas
  // recevoir directement une fonction async (elle retournerait une Promise
  // au lieu d'une fonction de cleanup).
  useEffect(() => {
    async function load() {
      const p = await fetchPrompt();
      setPrompt(p);
    }
    load();
  }, []);

  const handleTextChange = (v: string) => {
    if (v.length <= MAX_CHARS) setText(v);
  };

  const handleImageChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCapsul = () => {
    if (!text.trim()) return;
    setSavedMemory({ text, image });
    setTodayState('saved');
  };

  const handleEdit = () => {
    if (!savedMemory) return;
    setText(savedMemory.text);
    setImage(savedMemory.image);
    setSavedMemory(null);
    setTodayState('prompt');
  };

  const handleCancel = () => {
    setText('');
    setImage(null);
  };

  const totalWords = MOCK_HISTORICAL_WORDS + (savedMemory ? countWords(savedMemory.text) : 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/*
        gap-6 lg:gap-12 : sur desktop la gouttière entre colonne gauche et sidebar
        est nettement plus large pour aérer.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-12 items-start">

        {/* ── Colonne gauche ── */}
        {/*
          gap-6 lg:gap-8 : espace entre PromptCard et EntryCard.
          Sur desktop c'est 32px de blanc entre la question et la zone de saisie.
        */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {todayState === 'prompt' && (
            <>
              <PromptCard
                prompt={prompt ?? '...'}
                onRefresh={async () => {
                  setPrompt(null);
                  const p = await fetchPrompt();
                  setPrompt(p);
                }}
              />
              <EntryCard
                dateStr={dateStr}
                text={text}
                image={image}
                onTextChange={handleTextChange}
                onImageChange={handleImageChange}
                onImageRemove={() => setImage(null)}
                onCapsul={handleCapsul}
                onCancel={handleCancel}
              />
            </>
          )}

          {todayState === 'saved' && savedMemory && (
            <>
              <SavedEntryCard dateStr={dateStr} memory={savedMemory} onEdit={handleEdit} />
              <SuccessBanner />
              <PastMemoryCard />
            </>
          )}
        </div>

        {/* ── Sidebar droite ── */}
        <div className="lg:sticky lg:top-20">
          <TreeSidebar saved={todayState === 'saved'} totalWords={totalWords} />
        </div>
      </div>
    </div>
  );
}
