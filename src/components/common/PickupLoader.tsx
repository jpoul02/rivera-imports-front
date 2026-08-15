"use client";

import Lottie, { type LottieComponentProps } from "lottie-react";
import pickupAnimation from "./pickup-splash-data.json";

type PickupLoaderProps = Partial<LottieComponentProps>;

/** Animación del pickup armándose pieza por pieza — generada desde el trazo real de pickup.svg. */
export function PickupLoader(props: PickupLoaderProps) {
  return <Lottie animationData={pickupAnimation} loop={false} autoplay {...props} />;
}
