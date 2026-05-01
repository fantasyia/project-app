"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Search, UserPlus } from "lucide-react";
import { searchCreators } from "@/lib/actions/posts";

type SearchCreatorResult = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
};

const quickSuggestions = ["Fotografia", "Lifestyle", "Creator novo", "Video exclusivo"];

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchCreatorResult[]>([]);
  const [pending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);

  function handleSearch() {
    if (!query.trim()) return;
    setSearched(true);

    startTransition(async () => {
      const data = await searchCreators(query);
      setResults(data as SearchCreatorResult[]);
    });
  }

  return (
    <div className="flex flex-col">
      {/* Search Input */}
      <div className="px-4 pb-3 pt-3">
        <div className="flex items-center gap-3 rounded-xl bg-brand-surface-low px-3.5 py-2.5">
          <Search size={18} className="flex-shrink-0 text-brand-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSearch()}
            placeholder="Buscar creators..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-brand-text-muted/60"
          />
          {query && (
            <button
              onClick={handleSearch}
              disabled={pending}
              className="text-sm font-semibold text-brand-500 disabled:opacity-50"
            >
              Buscar
            </button>
          )}
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {quickSuggestions.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setQuery(label);
              setSearched(false);
              setResults([]);
            }}
            className="flex-shrink-0 rounded-full bg-brand-surface-low px-3.5 py-1.5 text-xs text-brand-text-muted transition hover:bg-brand-surface-high hover:text-white"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Loading */}
      {pending && (
        <div className="px-4 py-12 text-center text-sm text-brand-text-muted">
          Buscando creators...
        </div>
      )}

      {/* Empty */}
      {searched && !pending && results.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-brand-text-muted">
          Nenhum creator encontrado para &quot;{query}&quot;.
        </div>
      )}

      {/* Results */}
      {!pending && results.length > 0 && (
        <div className="flex flex-col">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3"
            >
              <Link
                href={user.handle ? `/${user.handle}` : "/dashboard/user/feed"}
                className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-brand-surface-high"
              >
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.display_name || "Creator"}
                    width={48}
                    height={48}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-500/20 font-bold text-brand-500">
                    {user.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </Link>
              <Link
                href={user.handle ? `/${user.handle}` : "/dashboard/user/feed"}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-semibold text-white">{user.display_name || "Creator"}</p>
                <p className="text-xs text-brand-text-muted">@{user.handle || "sem-handle"}</p>
              </Link>
              <Link
                href={user.handle ? `/${user.handle}` : "/dashboard/user/feed"}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-brand-400"
              >
                <UserPlus size={14} />
                Seguir
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Placeholder */}
      {!searched && !pending && (
        <div className="px-6 py-16 text-center text-sm text-brand-text-muted">
          Busque creators, categorias e perfis.
        </div>
      )}
    </div>
  );
}
