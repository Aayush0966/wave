import SignUpLoginAnimation from "@/components/auth/SignUpAnimation";
import SignUpForm from "@/components/auth/sign-up-form";

const SignUpPage = () => {
	return (
		<div className="grid h-screen grid-cols-2 overflow-hidden">
			{/* Illustration */}
			<div className="flex flex-col items-center bg-[#8a8989]">
				<h1 className="mt-32 font-bold font-sans text-3xl">Welcome</h1>
				<SignUpLoginAnimation />
			</div>

			{/* Sign-in form */}
			<div className="flex items-center justify-center bg-text-primary">
				<div className="w-full max-w-xl">
					<SignUpForm />
				</div>
			</div>
		</div>
	);
};

export default SignUpPage;
