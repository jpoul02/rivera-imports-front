import { ProductDetailScreen } from "@/components/screens/ProductDetailScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailScreen id={id} />;
}
