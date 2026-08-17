"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { globalSearch, GlobalSearchResult } from "@/app/admin/actions/search";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      setIsLoading(true);
      globalSearch(debouncedQuery).then(res => {
        setResults(res);
        setIsLoading(false);
        setIsOpen(true);
      }).catch(() => {
        setIsLoading(false);
      });
    } else {
      setResults(null);
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  const hasResults = results && (results.users.length > 0 || results.cases.length > 0 || results.courses.length > 0);

  return (
    <div ref={ref} className="relative hidden md:flex items-center gap-2 bg-plum-950/50 px-3 py-1.5 rounded-md text-cream-50/70 focus-within:ring-1 focus-within:ring-gold-500 transition-all w-48 lg:w-64 border border-plum-800">
      {isLoading ? <Loader2 size={16} className="animate-spin text-muted" /> : <Search size={16} />}
      <input 
        type="text" 
        placeholder="Buscar..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (hasResults) setIsOpen(true) }}
        className="bg-transparent border-none outline-none text-sm w-full text-cream-50 placeholder:text-muted"
      />
      
      {isOpen && (query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white text-ink rounded-md shadow-lg border border-border py-2 z-50 max-h-96 overflow-y-auto">
          {!isLoading && !hasResults && (
            <div className="px-4 py-3 text-sm text-muted text-center">Nenhum resultado encontrado.</div>
          )}
          
          {results?.users.length ? (
            <div className="mb-2">
              <div className="px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider">Usuários</div>
              {results.users.map(u => (
                <button key={u.id} onClick={() => handleSelect(u.href)} className="w-full text-left px-4 py-2 text-sm hover:bg-cream-50 transition-colors flex flex-col">
                  <span className="font-medium text-ink">{u.title}</span>
                  {u.subtitle && <span className="text-xs text-muted truncate">{u.subtitle}</span>}
                </button>
              ))}
            </div>
          ) : null}

          {results?.cases.length ? (
            <div className="mb-2">
              <div className="px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider">Casos</div>
              {results.cases.map(c => (
                <button key={c.id} onClick={() => handleSelect(c.href)} className="w-full text-left px-4 py-2 text-sm hover:bg-cream-50 transition-colors flex flex-col">
                  <span className="font-medium text-ink">{c.title}</span>
                  {c.subtitle && <span className="text-xs text-muted truncate">{c.subtitle}</span>}
                </button>
              ))}
            </div>
          ) : null}

          {results?.courses.length ? (
            <div className="mb-2">
              <div className="px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider">Cursos</div>
              {results.courses.map(c => (
                <button key={c.id} onClick={() => handleSelect(c.href)} className="w-full text-left px-4 py-2 text-sm hover:bg-cream-50 transition-colors flex flex-col">
                  <span className="font-medium text-ink">{c.title}</span>
                  {c.subtitle && <span className="text-xs text-muted truncate">{c.subtitle}</span>}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
