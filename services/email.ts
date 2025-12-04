// services/email.ts
import { ServerClient } from "postmark";

// Use the Postmark API token from environment or fallback to the provided one
const apiToken = process.env.POSTMARK_API_TOKEN || "cdd7a74d-1453-4891-b9fb-9333a9190fff";
const client = new ServerClient(apiToken);

export async function sendEmail({
  to,
  subject,
  html,
  text,
  messageStream,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  messageStream?: string;
}) {
  try {
    const result = await client.sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL || "no-reply@bandldisposal.com",
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text ?? html.replace(/<[^>]+>/g, ''), // fallback plain text
      MessageStream: messageStream || "outbound", // default transactional stream
    });

    console.log("[Email] Sent:", result.MessageID);

    return result;
  } catch (err: any) {
    console.error("[Email] Error:", err);
    throw err;
  }
}
