import { render } from "@react-email/render";
import { TRPCError } from "@trpc/server";
import { createElement } from "react";
import transporter from ".";
import emailTemplates from "./templates";

interface EmailDTO {
	to: string;
	subject: string;
	type: "EMAIL_VERIFY" | "RESET_PASSWORD";
	name: string;
	link: string;
}
export default async function sendEmail({
	to,
	subject,
	type,
	name,
	link,
}: EmailDTO) {
	try {
		const template = getTemplate(type);
		const html = await render(createElement(template, { name, link }));
		const mailOptions = {
			from: `Wave <${process.env.EMAIL}>`,
			to,
			subject,
			html,
		};
		const result = await transporter.sendMail(mailOptions);

		if (result.rejected.length > 0) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Email rejected: ${result.response}`,
			});
		}

		return result;
	} catch (error) {
		console.log("Error while sending email: ", error);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to send email",
			cause: error,
		});
	}
}

const getTemplate = (type: EmailDTO["type"]) => {
	switch (type) {
		case "EMAIL_VERIFY":
			return emailTemplates.EmailVerification;
		case "RESET_PASSWORD":
			return emailTemplates.ResetPasswordEmail;
	}
};
