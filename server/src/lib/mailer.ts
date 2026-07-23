import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export async function sendInviteEmail(opts: {
  to: string;
  inviterName: string;
  babyNames: string[];
  inviteUrl: string;
  hasAccount: boolean;
}) {
  const { to, inviterName, babyNames, inviteUrl, hasAccount } = opts;
  const babies = joinNames(babyNames);
  const cta = hasAccount ? "Sign in to accept" : "Sign up to accept";
  const subject = `${inviterName} invited you to Little Notes`;

  const text = `${inviterName} invited you to help track ${babies} on Little Notes.\n\n${cta}: ${inviteUrl}\n\nIf you weren't expecting this, you can ignore this email.`;

  const html = `
    <p>${inviterName} invited you to help track <strong>${babies}</strong> on Little Notes.</p>
    <p><a href="${inviteUrl}" style="display:inline-block;padding:10px 20px;background:#ec4899;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">${cta}</a></p>
    <p style="color:#888;font-size:13px;">If you weren't expecting this, you can ignore this email.</p>
  `;

  await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, text, html });
}
