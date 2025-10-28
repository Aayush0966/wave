import { render } from "@react-email/render";
import { createError, toWaveError } from "@wave/error";
import { createElement } from "react";
import transporter from ".";
import emailTemplates from "./templates";

interface EmailDTO {
	to: string;
	subject: string;
	text: string;
	type: "EMAIL_VERIFY" | "RESET_PASSWORD";
	name: string;
	link: string;
}
export default async function sendEmail({
	to,
	subject,
	text,
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
			text,
			html,
		};
		const result = await transporter.sendMail(mailOptions);

		if (result.rejected.length > 0) {
			throw createError.internal(`Email rejected: ${result.response}`);
		}

		return result;
	} catch (error) {
		throw toWaveError(error);
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
