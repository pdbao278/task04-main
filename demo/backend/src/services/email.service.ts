/**
 * Email service using Brevo (Sendinblue) API
 * For MVP: logs to console in development, sends via Brevo in production
 */

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: SendEmailParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@taskflow.app';
  const senderName = process.env.BREVO_SENDER_NAME || 'TaskFlow';

  // In development, just log the email
  if (process.env.NODE_ENV === 'development' || !apiKey || apiKey === 'your-brevo-api-key') {
    console.log('━━━ EMAIL (dev mode) ━━━');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${htmlContent}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━');
    return;
  }

  // Production: send via Brevo API
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Brevo email error:', error);
    throw new Error(`Failed to send email: ${response.status}`);
  }
}

/**
 * Send workspace invite email
 */
export async function sendInviteEmail(email: string, inviteToken: string, workspaceName: string): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const inviteLink = `${appUrl}/invite?token=${inviteToken}`;

  await sendEmail({
    to: email,
    subject: `Bạn được mời tham gia workspace "${workspaceName}" trên TaskFlow`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Lời mời tham gia TaskFlow</h2>
        <p>Bạn đã được mời tham gia workspace <strong>${workspaceName}</strong>.</p>
        <p>Click vào link dưới đây để chấp nhận lời mời:</p>
        <a href="${inviteLink}" 
           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Chấp nhận lời mời
        </a>
        <p style="color: #666; font-size: 14px;">Link này sẽ hết hạn sau 48 giờ.</p>
      </div>
    `,
  });
}
