import type { Metadata } from "next";
import { CatalogoFooter } from "@/components/catalogo/CatalogoFooter";
import { CatalogoHeader } from "@/components/catalogo/CatalogoHeader";
import { ListaInteresFlotante } from "@/components/catalogo/ListaInteresFlotante";
import { ListaInteresProvider } from "@/context/ListaInteresContext";

export const metadata: Metadata = {
  title: "Catálogo — Rivera Imports",
  description: "Catálogo de repuestos y partes de automóviles",
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ListaInteresProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <CatalogoHeader />
        <main className="flex-1">{children}</main>
        <CatalogoFooter />
        <ListaInteresFlotante />
      </div>
    </ListaInteresProvider>
  );
}
