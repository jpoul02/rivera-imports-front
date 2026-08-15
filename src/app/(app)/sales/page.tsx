import { SalesScreen } from "@/components/screens/SalesScreen";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <SalesScreen defaultTab={tab ?? "registrar"} />;
}
