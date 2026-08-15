"use client";

import Link from "next/link";

export function CatalogoHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/catalogo" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary">
            <span className="display-title text-lg leading-none text-primary-foreground">
              RI
            </span>
          </div>
          <span className="display-title text-sm tracking-[0.3em] text-white">
            RIVERA IMPORTS
          </span>
        </Link>
        <Link
          href="/login"
          className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
        >
          Personal
        </Link>
      </div>
    </header>
  );
}
