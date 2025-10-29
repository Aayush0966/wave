import SignInAnimation from "@/components/auth/SignInAnimation";
import SignInForm from "@/components/auth/sign-in-form";

const SignInPage = () => {
	return (
		<div className="grid h-screen overflow-hidden lg:grid-cols-2">
			{/* Illustration */}
			<div className="hidden flex-col items-center bg-[#8a8989] lg:flex">
				<h1 className="mt-32 font-bold font-sans text-3xl">Welcome</h1>
				<SignInAnimation />
			</div>

			{/* Sign-in form */}
			<div className="flex items-center justify-center bg-text-primary">
				<div className="w-full max-w-xl p-10">
					<SignInForm />
				</div>
			</div>
		</div>
	);
};

export default SignInPage;
