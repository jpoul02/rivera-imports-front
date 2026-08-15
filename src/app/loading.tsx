import { PickupLoader } from "@/components/common/PickupLoader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950">
      <PickupLoader className="w-64" />
    </div>
  );
}
