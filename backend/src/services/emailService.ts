import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (!emailUser || !emailPassword) {
      console.warn('⚠️  [EMAIL SERVICE] Email credentials not configured. Email sending will be disabled.');
      console.warn('⚠️  [EMAIL SERVICE] Set EMAIL_USER and EMAIL_PASSWORD in .env file to enable email functionality.');
      this.isConfigured = false;
      return;
    }

    try {
      // SendGrid uses different configuration
      if (emailService.toLowerCase() === 'sendgrid') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false, // Use TLS
          auth: {
            user: 'apikey', // SendGrid SMTP strictly requires the literal string 'apikey'
            pass: emailPassword, // Your SendGrid API key
          },
        });
      } else {
        // Gmail, Outlook, etc.
        this.transporter = nodemailer.createTransport({
          service: emailService,
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });
      }

      this.isConfigured = true;
      console.log(`✅ [EMAIL SERVICE] Email service initialized successfully (${emailService})`);
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('❌ [EMAIL SERVICE] Cannot send email - service not configured');
      return false;
    }

    try {
      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const mailOptions = {
        from: `"UC METC SILMS" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL SERVICE] Email sent successfully to ${options.to} (Message ID: ${info.messageId})`);
      return true;
    } catch (error: any) {
      console.error(`❌ [EMAIL SERVICE] Failed to send email to ${options.to}:`, error?.message || error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationCode: string, userName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .code-box { background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 36px; font-weight: bold; color: #7c3aed; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Email Verification</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">UC METC SILMS</p>
        </div>
        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Welcome to UC METC SILMS! Please verify your email address by entering the code below:</p>
          <div class="code-box">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your Verification Code</div>
            <div class="code">${verificationCode}</div>
          </div>
          <p>Enter this code on the verification page to activate your account.</p>
          <div class="warning">
            <strong>Important:</strong> This code will expire in <strong>15 minutes</strong> for security reasons.
          </div>
          <p><strong>Didn't create an account?</strong><br>
          If you didn't register on UC METC SILMS, please ignore this email.</p>
          <p>Best regards,<br><strong>UC METC SILMS Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message from UC METC Sales, Inventory, Locker, and Management System.</p>
          <p>&copy; ${new Date().getFullYear()} UC METC SILMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - UC METC SILMS',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetCode: string, userName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .code-box {
            background: white;
            border: 2px solid #7c3aed;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            color: #7c3aed;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Password Reset Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">UC METC SILMS</p>
        </div>
        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>
          
          <p>We received a request to reset your password for your UC METC SILMS account. Use the verification code below to proceed:</p>
          
          <div class="code-box">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your Reset Code</div>
            <div class="code">${resetCode}</div>
          </div>
          
          <p>Enter this code on the password reset page to create a new password.</p>
          
          <div class="warning">
            <strong>Important:</strong> This code will expire in <strong>15 minutes</strong> for security reasons.
          </div>
          
          <p><strong>Didn't request this?</strong><br>
          If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <p>For security reasons, never share this code with anyone.</p>
          
          <p>Best regards,<br>
          <strong>UC METC SILMS Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message from UC METC Sales, Inventory, Locker, and Management System.</p>
          <p>© ${new Date().getFullYear()} UC METC SILMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Code - UC METC SILMS',
      html,
    });
  }

  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
