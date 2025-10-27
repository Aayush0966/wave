"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { animations } from "@wave/ui";

const SignUpAnimation = () => (
	<DotLottieReact
		src={animations.signupAnimation}
		loop
		autoplay
		height={300}
		width={300}
	/>
);

export default SignUpAnimation;
