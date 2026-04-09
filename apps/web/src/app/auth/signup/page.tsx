import SignUpAnimation from "@/components/auth/SignUpAnimation";
import SignUpForm from "@/components/auth/sign-up-form";

const SignUpPage = () => {
	return (
		<div className="grid h-screen overflow-hidden lg:grid-cols-2">
			{/* Illustration */}
			<div className="hidden flex-col items-center bg-[#8a8989] lg:flex">
				<h1 className="mt-32 font-bold font-sans text-3xl">Welcome</h1>
				<SignUpAnimation />
			</div>

			{/* Sign-in form */}
			<div className="flex items-center justify-center bg-white dark:bg-background-primary">
				<div className="w-full max-w-xl p-5">
					<SignUpForm />
				</div>
			</div>
		</div>
	);
};

export default SignUpPage;
