"use client";

import Link from "next/link";
import Image from "next/image";

export function CatalogoHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/catalogo" className="flex items-center gap-3">
          <Image
            src="/pickup.svg"
            alt="Rivera Imports"
            width={324}
            height={110}
            className="h-9 w-auto"
          />
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
