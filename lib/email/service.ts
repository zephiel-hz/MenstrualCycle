import crypto from "crypto";
import nodemailer from "nodemailer";
import { Resend } from "resend";

export interface SendVerificationEmailOptions {
  email: string;
  code: string;
  type: "register" | "forgot_password";
  displayName?: string;
}

export function generateOtp(): string {
  // Generate cryptographically secure 6-digit number
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

function getEmailHtml(code: string, type: "register" | "forgot_password", displayName?: string): string {
  const isRegister = type === "register";
  const title = isRegister ? "Verifikasi Akun Lunara" : "Pemulihan Kata Sandi";
  const subtitle = isRegister
    ? "Gunakan kode verifikasi berikut untuk menyelesaikan pendaftaran akun Lunara Anda."
    : "Gunakan kode verifikasi berikut untuk mengatur ulang kata sandi akun Lunara Anda.";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #221B1F;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FBF9F6; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #EFE8DE; padding: 36px 28px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);">
          <!-- Logo & Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="width: 48px; height: 48px; background-color: #D8647F; border-radius: 16px; margin: 0 auto 12px auto; text-align: center; line-height: 48px; color: #FFFFFF; font-size: 22px; font-weight: bold;">
                🌙
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #221B1F; letter-spacing: -0.5px; font-family: 'Playfair Display', Georgia, serif;">Lunara</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #A3969F; text-transform: uppercase; letter-spacing: 2px;">Wellness & Cycle Journal</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top: 1px solid #F0EAE1; padding-top: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #221B1F;">
                Halo${displayName ? ` ${displayName}` : ""},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #7A6E75;">
                ${subtitle}
              </p>
            </td>
          </tr>

          <!-- OTP Code Box -->
          <tr>
            <td align="center" style="padding: 12px 0 28px 0;">
              <div style="background-color: #FAF0F2; border: 1px solid #F0D5DC; border-radius: 18px; padding: 20px 24px; display: inline-block;">
                <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #D8647F; font-family: 'Courier New', Courier, monospace; display: block; margin-left: 8px;">
                  ${code}
                </span>
              </div>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #A3969F;">
                ⏱️ Kode berlaku selama <strong>15 menit</strong>.
              </p>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="background-color: #FAF9F6; border-radius: 14px; padding: 14px 16px; border: 1px solid #EFE8DE;">
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #7A6E75;">
                🔒 <strong>Penting:</strong> Jangan berikan kode ini kepada siapa pun. Tim Lunara tidak akan pernah meminta kode verifikasi Anda. Jika Anda tidak merasa meminta kode ini, abaikan email ini.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px; border-top: 1px solid #F0EAE1; margin-top: 28px;">
              <p style="margin: 0; font-size: 11px; color: #A3969F;">
                © ${new Date().getFullYear()} Lunara. Jurnal Siklus & Kesehatan Mandiri.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendVerificationEmail({
  email,
  code,
  type,
  displayName,
}: SendVerificationEmailOptions): Promise<{ success: boolean; method: string }> {
  const subject =
    type === "register"
      ? `Kode Verifikasi Pendaftaran Lunara: ${code}`
      : `Kode Pemulihan Kata Sandi Lunara: ${code}`;
  const html = getEmailHtml(code, type, displayName);

  // 1. Check Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.EMAIL_FROM || "Lunara <onboarding@resend.dev>";

      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject,
        html,
      });

      console.log(`[Email] Sent verification code to ${email} via Resend.`);
      return { success: true, method: "resend" };
    } catch (err) {
      console.error("[Email] Failed to send via Resend:", err);
    }
  }

  // 2. Check SMTP Config
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    try {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = port === 465;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Lunara" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html,
      });

      console.log(`[Email] Sent verification code to ${email} via SMTP.`);
      return { success: true, method: "smtp" };
    } catch (err) {
      console.error("[Email] Failed to send via SMTP:", err);
    }
  }

  // 3. Dev / Fallback Console Logging
  console.log("==================================================");
  console.log(`[Lunara Dev Email Dispatch]`);
  console.log(`To: ${email}`);
  console.log(`Type: ${type}`);
  console.log(`Verification Code (OTP): ${code}`);
  console.log(`Expires: 15 minutes`);
  console.log("==================================================");

  return { success: true, method: "dev_console" };
}
