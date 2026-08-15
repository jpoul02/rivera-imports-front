import type { Metadata } from "next";
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
      <div className="min-h-screen bg-background">
        <CatalogoHeader />
        <main>{children}</main>
        <ListaInteresFlotante />
      </div>
    </ListaInteresProvider>
  );
}
