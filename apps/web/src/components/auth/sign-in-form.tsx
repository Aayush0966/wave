"use client";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Loader from "../loader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function SignInForm() {
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success("Sign in successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="w-full">
			<div className="mb-8 text-center">
				<h1 className="font-semibold text-2xl text-night-800 dark:text-text-primary tracking-tight">Welcome back</h1>
				<p className="mt-1 text-silver text-sm">Sign in to your account to continue</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-5"
			>
				<form.Field name="email">
					{(field) => (
						<div className="space-y-1.5">
							<Label htmlFor={field.name} className="text-night-800 dark:text-text-primary text-sm font-medium">
								Email
							</Label>
							<Input
								id={field.name}
								name={field.name}
								type="email"
								placeholder="you@example.com"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								className="h-10 bg-white dark:bg-background-secondary text-night-800 dark:text-text-primary placeholder:text-silver/60 border-silver/30 dark:border-jet focus-visible:ring-primary"
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-destructive text-xs">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<div className="space-y-1.5">
							<Label htmlFor={field.name} className="text-night-800 dark:text-text-primary text-sm font-medium">
								Password
							</Label>
							<Input
								id={field.name}
								name={field.name}
								type="password"
								placeholder="••••••••"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								className="h-10 bg-white dark:bg-background-secondary text-night-800 dark:text-text-primary placeholder:text-silver/60 border-silver/30 dark:border-jet focus-visible:ring-primary"
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-destructive text-xs">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<form.Subscribe>
					{(state) => (
						<Button
							type="submit"
							className="mt-2 h-10 w-full cursor-pointer bg-primary font-medium text-text-primary hover:bg-primary-dark"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? "Signing in..." : "Sign in"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<p className="mt-6 text-center text-silver text-sm">
				Don&apos;t have an account?{" "}
				<button
					type="button"
					onClick={() => router.replace("/auth/signup")}
					className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline"
				>
					Sign up
				</button>
			</p>
		</div>
	);
}
