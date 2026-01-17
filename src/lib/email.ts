import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY || "",
});

const sender = new Sender(
    "no-reply@test-z0vklo6jm3xl7qrx.mlsender.net",
    "ResumeForge"
);

export async function sendVerificationEmail(email: string, name: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost";
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const recipients = [new Recipient(email, name)];

    const emailParams = new EmailParams()
        .setFrom(sender)
        .setTo(recipients)
        .setSubject("Verify your ResumeForge account")
        .setHtml(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ResumeForge!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for signing up! To complete your registration and start creating professional resumes, please verify your email address.</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with ResumeForge, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 ResumeForge. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `)
        .setText(`
      Welcome to ResumeForge!
      
      Hi ${name},
      
      Thank you for signing up! To complete your registration, please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with ResumeForge, please ignore this email.
      
      © 2024 ResumeForge
    `);

    await mailerSend.email.send(emailParams);
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const recipients = [new Recipient(email, name)];

    const emailParams = new EmailParams()
        .setFrom(sender)
        .setTo(recipients)
        .setSubject("Reset your ResumeForge password")
        .setHtml(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
          </div>
          <div class="footer">
            <p>© 2024 ResumeForge. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `)
        .setText(`
      Reset Your Password
      
      Hi ${name},
      
      We received a request to reset your password. Click the link below to create a new password:
      
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email.
      
      © 2024 ResumeForge
    `);

    await mailerSend.email.send(emailParams);
}
