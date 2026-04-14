import { useState, useEffect, useRef } from 'preact/hooks';
import { Home, Clock, Sparkles, Sprout, User, ShieldCheck, ChevronDown } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import { Avatar } from '../Avatar/Avatar';
import type { NavbarProps, Page } from './Navbar.types';

const NAV_ITEMS = [
  { page: 'today'    as Page, label: 'Today',    Icon: Home    },
  { page: 'timeline' as Page, label: 'Timeline', Icon: Clock   },
  { page: 'memories' as Page, label: 'Memories', Icon: Sparkles },
  { page: 'tree'     as Page, label: 'Tree',     Icon: Sprout  },
] as const;

const navBtnBase = 'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200';
const dropdownItemBase = 'w-full flex items-center gap-3 px-4 py-3 text-sm text-darkgrey hover:bg-verylightorange transition-colors';

export function Navbar({ currentPage, onNavigate, user }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleAvatarClick = () => {
    if (user?.isAdmin) {
      setDropdownOpen((prev) => !prev);
    } else {
      onNavigate('profile');
    }
  };

  return (
    <>
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-40 items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md border-b border-black/5">

        <span
          className="text-xl font-black text-darkgrey tracking-tight cursor-pointer"
          onClick={() => onNavigate('today')}
        >
          CAPSUL
        </span>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ page, label, Icon }) => {
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={cn(
                  navBtnBase,
                  isActive
                    ? 'bg-yellow text-darkgrey'
                    : 'text-mediumgrey hover:text-darkgrey hover:bg-lightgrey',
                )}
              >
                <Icon size={18} strokeWidth={1.8} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleAvatarClick}
            className="flex items-center gap-1.5 rounded-full transition-opacity hover:opacity-80"
            aria-label="User menu"
          >
            {user ? (
              <Avatar name={user.username} src={user.avatarURL} size="md" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-yellow flex items-center justify-center">
                <User size={18} className="text-darkgrey" />
              </div>
            )}
            {user?.isAdmin && (
              <ChevronDown
                size={14}
                strokeWidth={2.5}
                className={cn('text-mediumgrey transition-transform duration-200', dropdownOpen && 'rotate-180')}
              />
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden py-1">
              <button
                onClick={() => { onNavigate('profile'); setDropdownOpen(false); }}
                className={dropdownItemBase}
              >
                <User size={16} className="text-mediumgrey" />
                My Profile
              </button>
              <div className="h-px bg-black/5 mx-3" />
              <button
                onClick={() => { onNavigate('admin'); setDropdownOpen(false); }}
                className={dropdownItemBase}
              >
                <ShieldCheck size={16} className="text-mediumgrey" />
                Admin Dashboard
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-white border-t border-black/5">
        {[...NAV_ITEMS, { page: 'profile' as Page, label: 'Profile', Icon: User }].map(({ page, label, Icon }) => {
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
                isActive && 'bg-yellow',
              )}>
                <Icon size={18} strokeWidth={1.8} className={isActive ? 'text-darkgrey' : 'text-mediumgrey'} />
              </div>
              <span className={cn('text-[10px] font-semibold', isActive ? 'text-darkgrey' : 'text-mediumgrey')}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
