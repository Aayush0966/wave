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

export default function SignUpForm() {
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
			username: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
					username: value.username,
				},
				{
					onSuccess: () => {
						router.push("/auth/signin");
						toast.success("Sign up successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Name must be at least 2 characters"),
				username: z.string().min(2, "Username must be at least 4 characters"),
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
				<h1 className="font-semibold text-2xl text-night-800 dark:text-text-primary tracking-tight">Create an account</h1>
				<p className="mt-1 text-silver text-sm">Fill in the details below to get started</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div className="grid grid-cols-2 gap-4">
					<form.Field name="name">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="text-night-800 dark:text-text-primary text-sm font-medium">
									Name
								</Label>
								<Input
									id={field.name}
									name={field.name}
									placeholder="Jane Doe"
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

					<form.Field name="username">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={field.name} className="text-night-800 dark:text-text-primary text-sm font-medium">
									Username
								</Label>
								<Input
									id={field.name}
									name={field.name}
									placeholder="janedoe"
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
				</div>

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
							{state.isSubmitting ? "Creating account..." : "Create account"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<p className="mt-6 text-center text-silver text-sm">
				Already have an account?{" "}
				<button
					type="button"
					onClick={() => router.replace("/auth/signin")}
					className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline"
				>
					Sign in
				</button>
			</p>
		</div>
	);
}
