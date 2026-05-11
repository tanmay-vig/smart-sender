import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GROQ_API_KEY || "";
console.log(`[AIService] Using Groq key: ${apiKey ? apiKey.slice(0, 8) + '...' + apiKey.slice(-4) : 'NOT SET'}`);
const openai = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
});

interface GenerateEmailParams {
    senderName: string;
    senderEmail: string;
    senderCompany?: string;
    senderPosition?: string;
    senderContact?: string;
    senderLinkedIn?: string;
    recipientName: string;
    recipientEmail: string;
    recipientCompany?: string;
    prompt: string;
}

interface GeneratedEmail {
    subject: string;
    html: string;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class GeminiService {
    async generateEmail(params: GenerateEmailParams, retries = 2): Promise<GeneratedEmail> {
        const { senderName, senderEmail, senderCompany, senderPosition, senderContact, senderLinkedIn, recipientName, recipientEmail, recipientCompany, prompt } = params;

        const systemMessage = `You are a professional email writer. Generate a personalized email based on the user's instructions.

SENDER INFO:
- Name: ${senderName}
- Email: ${senderEmail}
${senderCompany ? `- Company: ${senderCompany}` : ""}
${senderPosition ? `- Position: ${senderPosition}` : ""}
${senderContact ? `- Contact: ${senderContact}` : ""}
${senderLinkedIn ? `- LinkedIn: ${senderLinkedIn}` : ""}

RECIPIENT INFO:
- Name: ${recipientName || "Sir/Ma'am"}
- Email: ${recipientEmail}
${recipientCompany ? `- Company: ${recipientCompany}` : ""}

RULES:
1. Return ONLY valid JSON with exactly two keys: "subject" and "html"
2. The "html" must be a complete HTML email body using <p>, <strong>, <br>, <a> tags
3. Personalize for the specific recipient using their name and company
4. Include sender's signature with name, contact, and LinkedIn at the end
5. Professional but natural tone
6. No markdown, code fences, or text outside the JSON
7. The email should feel human-written, not templated

Return ONLY the JSON object.`;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await openai.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemMessage },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.7,
                });

                const text = (response.choices[0]?.message?.content || "").trim();
                let cleaned = text;
                if (cleaned.startsWith("```")) {
                    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
                }

                const parsed: GeneratedEmail = JSON.parse(cleaned);
                if (!parsed.subject || !parsed.html) throw new Error("OpenAI returned incomplete data");
                return parsed;
            } catch (err: any) {
                const errMsg = String(err?.message || err || '');
                if (errMsg.includes('insufficient_quota') || errMsg.includes('billing')) {
                    throw new Error('OpenAI quota exhausted. Check billing at https://platform.openai.com/account/billing');
                }
                if ((errMsg.includes('429') || errMsg.includes('Rate limit')) && attempt < retries) {
                    console.log(`Rate limited for ${recipientEmail}, retrying in ${(attempt + 1) * 5}s`);
                    await delay((attempt + 1) * 5000);
                    continue;
                }
                throw err;
            }
        }
        throw new Error('Failed to generate email after retries');
    }

    async generateBulkEmails(
        recipients: Array<{ name: string; email: string; company?: string }>,
        senderInfo: { name: string; email: string; company?: string; position?: string; contact?: string; linkedIn?: string },
        prompt: string
    ): Promise<Map<string, GeneratedEmail>> {
        const results = new Map<string, GeneratedEmail>();
        let consecutiveFailures = 0;

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            if (i > 0) await delay(1000);

            try {
                const generated = await this.generateEmail({
                    senderName: senderInfo.name, senderEmail: senderInfo.email,
                    senderCompany: senderInfo.company, senderPosition: senderInfo.position,
                    senderContact: senderInfo.contact, senderLinkedIn: senderInfo.linkedIn,
                    recipientName: recipient.name, recipientEmail: recipient.email,
                    recipientCompany: recipient.company, prompt,
                });
                results.set(recipient.email, generated);
                consecutiveFailures = 0;
                console.log(`AI generated email for ${recipient.email}`);
            } catch (err: any) {
                consecutiveFailures++;
                const errMsg = String(err?.message || err || '');
                console.error(`Failed to generate email for ${recipient.email}:`, errMsg);
                if (errMsg.includes('quota') || errMsg.includes('billing') || consecutiveFailures >= 3) {
                    throw new Error(errMsg || 'OpenAI API error');
                }
                results.set(recipient.email, {
                    subject: `Message from ${senderInfo.name}`,
                    html: `<p>Hi ${recipient.name || "Sir/Ma'am"},</p><p>${prompt}</p><p>Regards,<br>${senderInfo.name}</p>`,
                });
            }
        }
        return results;
    }
}
