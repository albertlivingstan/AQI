import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-800/60 bg-black/40 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-all">
      <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-300 lg:hidden">
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-800/60 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search Cities...
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-white placeholder:text-slate-500 focus:ring-0 sm:text-sm"
            placeholder="Search for a city, e.g., 'London'..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="relative -m-2.5 p-2.5 text-slate-400 hover:text-amber-400 transition-colors">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-crimson-500 bg-red-500 animate-pulse"></span>
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-800/60" aria-hidden="true" />

          {/* Profile dropdown / Avatar */}
          <div className="flex items-center gap-x-4">
             <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 p-[2px]">
               <div className="h-full w-full rounded-full border-2 border-black bg-slate-800 flex items-center justify-center">
                 <span className="text-xs font-bold text-white">JD</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
