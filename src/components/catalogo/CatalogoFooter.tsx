import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

const NUMERO_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export function CatalogoFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950">
      <div aria-hidden className="h-1 racing-stripe" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div className="flex items-center gap-3">
          <Image src="/pickup.svg" alt="Rivera Imports" width={324} height={110} className="h-8 w-auto" />
          <div>
            <p className="display-title text-sm tracking-[0.3em] text-white">RIVERA IMPORTS</p>
            <p className="text-xs text-neutral-500">Repuestos y autopartes</p>
          </div>
        </div>

        {NUMERO_WHATSAPP && (
          <Link
            href={`https://wa.me/${NUMERO_WHATSAPP}`}
            target="_blank"
            className="flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
          >
            <MessageCircle className="h-4 w-4" />
            Escribinos por WhatsApp
          </Link>
        )}

        <p className="text-xs text-neutral-600">
          © {new Date().getFullYear()} Rivera Imports. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
