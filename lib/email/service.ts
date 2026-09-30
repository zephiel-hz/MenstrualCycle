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

  const badgeText = isRegister ? "✦ VERIFIKASI PENDAFTARAN" : "🔒 PEMULIHAN KATA SANDI";
  const badgeBg = isRegister ? "#FAF0F2" : "#FAF0F2";
  const badgeColor = "#D8647F";

  const headline = isRegister
    ? "Satu langkah lagi menuju jurnal siklus pribadimu."
    : "Atur ulang kata sandi akun Lunara Anda.";

  const message = isRegister
    ? "Terima kasih telah bergabung dengan <strong>Lunara</strong>. Gunakan 6-digit kode verifikasi di bawah ini pada aplikasi untuk mengaktifkan akun pribadimu:"
    : "Kami menerima permintaan pengaturan ulang kata sandi untuk akun Lunara Anda. Masukkan 6-digit kode verifikasi di bawah ini untuk membuat kata sandi baru:";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isRegister ? "Verifikasi Pendaftaran Lunara" : "Pemulihan Kata Sandi Lunara"}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FBF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #221B1F;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FBF9F6; padding: 48px 16px 64px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #FFFFFF; border-radius: 28px; border: 1px solid #EFE8DE; box-shadow: 0 10px 30px rgba(216, 100, 127, 0.06); overflow: hidden;">
          
          <!-- Top Accent Bar -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #F292A7, #E2748F, #D35773); font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <!-- Inner Content Padding -->
          <tr>
            <td style="padding: 38px 32px 36px 32px;">
              
              <!-- Brand Logo & Title (Consistent Squircle Logo) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <!-- Embedded SVG Squircle Logo matching exact brand icon -->
                    <div style="display: inline-block; margin-bottom: 12px;">
                      <svg width="52" height="52" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                        <defs>
                          <linearGradient id="emailLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#F292A7" />
                            <stop offset="50%" stop-color="#E2748F" />
                            <stop offset="100%" stop-color="#D35773" />
                          </linearGradient>
                        </defs>
                        <rect width="192" height="192" rx="48" fill="url(#emailLogoGrad)" />
                        <g transform="translate(54, 54) scale(3.5)">
                          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                        </g>
                      </svg>
                    </div>
                    <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 600; color: #221B1F; letter-spacing: -0.5px; line-height: 1;">
                      Lunara
                    </div>
                    <div style="font-size: 10px; font-weight: 700; color: #D8647F; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 6px;">
                      WELLNESS & CYCLE JOURNAL
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Purpose Pill Badge -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 6px 14px; border-radius: 9999px; border: 1px solid rgba(216, 100, 127, 0.2);">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Greeting & Headline -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top: 1px solid #F0EAE1; padding-top: 24px; padding-bottom: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #221B1F;">
                      Halo${displayName ? ` ${displayName}` : ""},
                    </p>
                    <h2 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 19px; font-weight: 600; color: #221B1F; line-height: 1.35;">
                      ${headline}
                    </h2>
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #7A6E75;">
                      ${message}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Hero OTP Code Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 10px 0 24px 0;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF0F2; border: 1.5px solid #F0D5DC; border-radius: 20px; box-shadow: 0 4px 12px rgba(216, 100, 127, 0.08);">
                      <tr>
                        <td align="center" style="padding: 18px 28px;">
                          <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #D8647F; line-height: 1; padding-left: 12px;">
                            ${code}
                          </div>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top: 12px; font-size: 11px; font-weight: 500; color: #A3969F;">
                      ⏱️ Kode ini hanya berlaku selama <strong style="color: #221B1F;">15 menit</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Card Note -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF9F6; border: 1px solid #EFE8DE; border-radius: 16px; margin-bottom: 8px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #7A6E75;">
                      🔒 <strong style="color: #221B1F;">Perlindungan Privasi:</strong> Jangan pernah membagikan kode ini kepada siapa pun. Pihak Lunara tidak akan pernah meminta kode ini melalui pesan atau media apa pun. Jika Anda tidak melakukan permintaan ini, abaikan email ini dan akun Anda tetap aman.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #FAF9F6; border-top: 1px solid #F0EAE1; padding: 22px 28px;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #7A6E75;">
                Aplikasi Pelacak Siklus Menstruasi Pribadi &amp; Ramah Privasi
              </p>
              <p style="margin: 0; font-size: 10px; color: #A3969F;">
                © ${new Date().getFullYear()} Lunara. Seluruh hak cipta dilindungi.
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
