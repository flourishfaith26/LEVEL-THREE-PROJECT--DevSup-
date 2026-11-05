import nodemailer from 'nodemailer';

export const sendPasswordResetEmail = async ({ toEmail, displayName, resetUrl }) => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const fromAddress = process.env.EMAIL_FROM || user || 'noreply@devsup.com';

    if (!user || !pass) {
        console.warn('[Mailer] EMAIL_USER and EMAIL_PASS environment variables are not set. Skipping actual email delivery.');
        return { sent: false, reason: 'Email credentials not configured' };
    }

    try {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: { user, pass }
        });

        const mailOptions = {
            from: `"DevSup" <${fromAddress}>`,
            to: toEmail,
            subject: 'Reset Your DevSup Password',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b141a; color: #e9edef; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #06B6D4; font-size: 28px; margin: 0; font-family: monospace;">&lt;/&gt; DevSup</h1>
                        <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Where Code Meets Conversation</p>
                    </div>
                    <div style="background-color: #1e293b; padding: 30px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
                        <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Password Reset Request</h2>
                        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                            Hello ${displayName || 'Developer'},
                        </p>
                        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                            We received a request to reset your password for your DevSup account. Click the button below to choose a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #06B6D4; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            This link will expire in <strong>1 hour</strong>. If you did not request this password reset, please ignore this email or reach out to support.
                        </p>
                        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;" />
                        <p style="color: #64748b; font-size: 12px; word-break: break-all;">
                            If the button doesn't work, copy and paste this URL into your browser:<br/>
                            <a href="${resetUrl}" style="color: #06B6D4;">${resetUrl}</a>
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[Mailer] Password reset email sent:', info.messageId);
        return { sent: true, messageId: info.messageId };
    } catch (err) {
        console.error('[Mailer] Failed to send password reset email:', err);
        return { sent: false, error: err.message };
    }
};

