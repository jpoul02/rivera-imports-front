import { CatalogoDetalleScreen } from "@/components/catalogo/CatalogoDetalleScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogoDetalleScreen id={id} />;
}
