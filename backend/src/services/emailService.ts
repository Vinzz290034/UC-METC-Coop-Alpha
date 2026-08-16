import nodemailer from 'nodemailer';
import axios from 'axios';
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
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');
    const emailSecure = process.env.EMAIL_SECURE === 'true';

    if (emailService.toLowerCase() === 'sendgrid' || emailService.toLowerCase() === 'brevo') {
      if (!emailPassword) {
        console.warn(`⚠️  [EMAIL SERVICE] ${emailService} API Key (EMAIL_PASSWORD) not configured.`);
        this.isConfigured = false;
        return;
      }
      this.isConfigured = true;
      console.log(`✅ [EMAIL SERVICE] Email service initialized successfully via ${emailService} Web API`);
      return;
    }

    if (!emailUser || !emailPassword) {
      console.warn('⚠️  [EMAIL SERVICE] Email credentials not configured. Email sending will be disabled.');
      console.warn('⚠️  [EMAIL SERVICE] Set EMAIL_USER and EMAIL_PASSWORD in .env file to enable email functionality.');
      this.isConfigured = false;
      return;
    }

    try {
      if (emailHost) {
        // Generic SMTP transport
        this.transporter = nodemailer.createTransport({
          host: emailHost,
          port: emailPort,
          secure: emailSecure,
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });
        console.log(`✅ [EMAIL SERVICE] Email service initialized successfully via custom SMTP (${emailHost}:${emailPort})`);
      } else {
        // Gmail, Outlook, etc.
        this.transporter = nodemailer.createTransport({
          service: emailService,
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });
        console.log(`✅ [EMAIL SERVICE] Email service initialized successfully (${emailService})`);
      }

      this.isConfigured = true;
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    const emailPassword = process.env.EMAIL_PASSWORD;
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@uc-metc-coop.com';

    if (!this.isConfigured) {
      console.error('❌ [EMAIL SERVICE] Cannot send email - service not configured');
      return false;
    }

    try {
      if (emailService.toLowerCase() === 'sendgrid') {
        // Send via official SendGrid HTTP API - ultra fast and immune to SMTP port blocks
        await axios.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [
              {
                to: [{ email: options.to }],
              },
            ],
            from: {
              email: fromEmail,
              name: 'UC METC SILMS',
            },
            subject: options.subject,
            content: [
              {
                type: 'text/html',
                value: options.html,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${emailPassword}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`✅ [EMAIL SERVICE] Email sent successfully to ${options.to} via SendGrid Web API`);
        return true;
      }

      if (emailService.toLowerCase() === 'brevo') {
        // Send via official Brevo HTTP API - ultra fast and immune to SMTP port blocks
        await axios.post(
          'https://api.brevo.com/v3/smtp/email',
          {
            sender: {
              email: fromEmail,
              name: 'UC METC SILMS',
            },
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.html,
          },
          {
            headers: {
              'api-key': emailPassword,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );
        console.log(`✅ [EMAIL SERVICE] Email sent successfully to ${options.to} via Brevo Web API`);
        return true;
      }

      // Gmail / SMTP fallback
      if (!this.transporter) {
        console.error('❌ [EMAIL SERVICE] Cannot send email - SMTP transporter not initialized');
        return false;
      }

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
      console.error(`❌ [EMAIL SERVICE] Failed to send email to ${options.to}:`, error?.response?.data || error?.message || error);
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
            background: #fee2e2;
            border-left: 4px solid #ef4444;
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
          
          <p>We received a request to reset the password for your UC METC SILMS account. Use the code below to complete the reset:</p>
          
          <div class="code-box">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your Reset Code</div>
            <div class="code">${resetCode}</div>
          </div>
          
          <p>Enter this code on the password reset page to choose a new password.</p>
          
          <div class="warning">
            <strong>Security Notice:</strong> This code will expire in <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email or contact support.
          </div>
          
          <p>Best regards,<br>
          <strong>UC METC SILMS Team</strong></p>
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
      subject: 'Reset Your Password - UC METC SILMS',
      html,
    });
  }
  async sendWalkInReceiptEmail(params: {
    email: string;
    customerName: string;
    receiptNo: string;
    totalAmount: number;
    items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[];
    paymentMethod: string;
    completedAt: Date;
  }): Promise<boolean> {
    const { email, customerName, receiptNo, totalAmount, items, paymentMethod, completedAt } = params;

    const formattedDate = completedAt.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemRows = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: left; font-size: 13px; font-weight: 500; color: #1e293b;">${item.productName}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 13px; font-weight: 700; color: #1e293b;">${item.quantity}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: 500; color: #475569;">₱${Number(item.unitPrice).toFixed(2)}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a;">₱${Number(item.subtotal).toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1e293b; background-color: #ffffff; margin: 0; padding: 24px 12px; }
          .wrapper { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
          .content { padding: 32px 28px; }
          .brand-title { font-size: 20px; font-weight: 800; color: #6d28d9; margin: 0 0 2px 0; letter-spacing: -0.3px; }
          .brand-sub { font-size: 11px; font-weight: 800; color: #7c3aed; margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 0.8px; }
          .greeting { font-size: 14px; color: #334155; margin-bottom: 22px; line-height: 1.5; }
          .receipt-header { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
          .receipt-header table { width: 100%; border-collapse: collapse; }
          .receipt-header td { font-size: 12px; color: #64748b; font-weight: 700; padding: 4px 0; }
          .receipt-header td.val { color: #0f172a; font-weight: 800; text-align: right; font-family: monospace, sans-serif; font-size: 13px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .items-table th { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 8px; border-bottom: 2px solid #e2e8f0; }
          .items-table td { font-size: 13px; color: #1e293b; padding: 10px 8px; border-bottom: 1px solid #f1f5f9; }
          .total-row td { font-size: 14px; font-weight: 900; color: #0f172a; border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 14px; }
          .footer { border-top: 1px solid #f1f5f9; padding: 20px 28px; background: #ffffff; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="content">
            <h1 class="brand-title">UC METC Multipurpose Cooperative</h1>
            <p class="brand-sub">OFFICIAL PURCHASE RECEIPT</p>

            <p class="greeting">Hello <strong>${customerName}</strong>, thank you for your purchase! Here is your official e-receipt for your records:</p>

            <div class="receipt-header">
              <table>
                <tr>
                  <td>Receipt Reference No.</td>
                  <td class="val">${receiptNo}</td>
                </tr>
                <tr>
                  <td>Date Completed</td>
                  <td class="val">${formattedDate}</td>
                </tr>
                <tr>
                  <td>Payment Method</td>
                  <td class="val" style="text-transform: capitalize;">${paymentMethod}</td>
                </tr>
              </table>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align: left; width: 45%;">ITEM DESCRIPTION</th>
                  <th style="text-align: center; width: 15%;">QTY</th>
                  <th style="text-align: right; width: 20%;">PRICE</th>
                  <th style="text-align: right; width: 20%;">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3" style="text-align: right; padding-right: 8px;">TOTAL PAID</td>
                  <td style="text-align: right;">₱${Number(totalAmount).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <p style="font-size: 12px; color: #64748b; margin: 0; text-align: center;">
              If you have any questions regarding this receipt, please visit the UC METC Cooperative counter.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0 0 4px 0;">UC METC Sales, Inventory, Locker, and Management System (SILMS)</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} UC METC SILMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Your Receipt – ${receiptNo} | UC METC Cooperative`,
      html,
    });
  }
}

export const emailService = new EmailService();
