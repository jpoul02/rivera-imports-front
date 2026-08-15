import { CatalogoListaScreen } from "@/components/catalogo/CatalogoListaScreen";
import { decodificarLista } from "@/lib/lista-codigo";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <CatalogoListaScreen items={decodificarLista(c)} />;
}
