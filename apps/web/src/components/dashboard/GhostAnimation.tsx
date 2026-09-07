"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { animations } from "@wave/ui";

const GhostAnimation = () => (
  <DotLottieReact
    src={animations.ghostAnimation}
    loop
    autoplay
    height={300}
    width={300}
  />
);

export default GhostAnimation;
