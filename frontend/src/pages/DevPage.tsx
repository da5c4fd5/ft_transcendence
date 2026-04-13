// TODO: Page temporaire — à supprimer quand les tests ne seront plus nécessaires

interface DevPageProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onPreviewGuestAnon: () => void;
  onLogout: () => void;
}

export function DevPage({ isAdmin, onToggleAdmin, onPreviewGuestAnon, onLogout }: DevPageProps) {
  return (
    <div className="p-6 flex flex-col gap-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-darkgrey">Dev Tools</h1>
      <button
        type="button"
        onClick={onToggleAdmin}
        className="px-4 py-2 bg-yellow rounded-full text-darkgrey font-semibold text-sm w-fit"
      >
        Switcher le rôle ({isAdmin ? 'passer en User' : 'passer en Admin'})
      </button>
      <button
        type="button"
        onClick={onPreviewGuestAnon}
        className="px-4 py-2 bg-blue rounded-full text-darkgrey font-semibold text-sm w-fit"
      >
        Preview vue invité (non connecté)
      </button>
    </div>
  );
}
