/**
 * Notification Service
 * Handles email notifications for new contests using Resend
 */

import { Resend } from 'resend';
import { ProcessedContest } from '../types';
import { logger } from '../utils/logger';

export interface NotificationConfig {
  fromEmail: string;
  toEmails: string[];
  enabled: boolean;
}

export interface NotificationResult {
  success: boolean;
  message: string;
  sentCount?: number;
  errors?: string[];
}

export class NotificationService {
  private resend: Resend | null = null;
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
    
    // Read API key from environment variable
    const apiKey = process.env.RESEND_API_KEY;
    
    if (config.enabled && apiKey) {
      this.resend = new Resend(apiKey);
      logger.info('NotificationService initialized with Resend');
    } else if (config.enabled && !apiKey) {
      logger.warn('NotificationService enabled but RESEND_API_KEY not set');
    } else {
      logger.debug('NotificationService disabled');
    }
  }

  /**
   * Send notification for new contests
   */
  async notifyNewContests(
    newContests: ProcessedContest[]
  ): Promise<NotificationResult> {
    if (!this.config.enabled) {
      return {
        success: true,
        message: 'Notifications disabled',
        sentCount: 0,
      };
    }

    if (!this.resend) {
      return {
        success: false,
        message: 'Resend client not initialized. Check API key.',
      };
    }

    if (newContests.length === 0) {
      logger.info('No new contests to notify about');
      return {
        success: true,
        message: 'No new contests',
        sentCount: 0,
      };
    }

    try {
      const htmlContent = this.generateEmailHtml(newContests);
      const textContent = this.generateEmailText(newContests);

      const { error } = await this.resend.emails.send({
        from: this.config.fromEmail,
        to: this.config.toEmails,
        subject: `🏆 ${newContests.length} New AI Contest${newContests.length > 1 ? 's' : ''} Found!`,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        logger.error('Failed to send notification email', { error });
        return {
          success: false,
          message: `Failed to send email: ${error.message}`,
          errors: [error.message],
        };
      }

      logger.info(`Sent notification for ${newContests.length} new contests`, {
        recipients: this.config.toEmails,
      });

      return {
        success: true,
        message: `Notified about ${newContests.length} new contests`,
        sentCount: newContests.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to send notification', { error: errorMessage });
      return {
        success: false,
        message: `Failed to send notification: ${errorMessage}`,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHtml(contests: ProcessedContest[]): string {
    const contestCards = contests
      .map(
        contest => `
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fafafa;">
          <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">
            <a href="${contest.url}" style="color: #2563eb; text-decoration: none;">${contest.title}</a>
          </h3>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
            <strong>Platform:</strong> ${contest.platform} | 
            <strong>Status:</strong> ${contest.status}
            ${contest.deadline ? ` | <strong>Deadline:</strong> ${new Date(contest.deadline).toLocaleDateString()}` : ''}
          </p>
          ${contest.prize ? `<p style="margin: 0 0 8px 0; color: #059669; font-weight: bold;">💰 ${contest.prize}</p>` : ''}
          <p style="margin: 0; color: #444; font-size: 14px;">${(contest.description || '').substring(0, 200)}${(contest.description || '').length > 200 ? '...' : ''}</p>
          ${contest.tags && contest.tags.length > 0 ? `
            <p style="margin: 8px 0 0 0;">
              ${contest.tags.slice(0, 5).map(tag => `<span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px;">${tag}</span>`).join('')}
            </p>
          ` : ''}
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px;">🏆 AI Contest Navigator</h1>
            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">${contests.length} New Contest${contests.length > 1 ? 's' : ''} Found!</p>
          </div>
          
          <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px;">
            ${contestCards}
            
            <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #888; font-size: 12px;">
                Sent by AI Contest Navigator<br>
                <a href="https://github.com/ai-contests/nav" style="color: #2563eb;">View on GitHub</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate plain text email content
   */
  private generateEmailText(contests: ProcessedContest[]): string {
    const contestList = contests
      .map(
        (contest, index) => `
${index + 1}. ${contest.title}
   Platform: ${contest.platform}
   Status: ${contest.status}
   ${contest.deadline ? `Deadline: ${new Date(contest.deadline).toLocaleDateString()}` : ''}
   ${contest.prize ? `Prize: ${contest.prize}` : ''}
   URL: ${contest.url}
   ${contest.description ? `Description: ${(contest.description).substring(0, 150)}...` : ''}
`
      )
      .join('\n');

    return `
🏆 AI Contest Navigator - ${contests.length} New Contest${contests.length > 1 ? 's' : ''} Found!
═══════════════════════════════════════════════════════════

${contestList}

---
Sent by AI Contest Navigator
https://github.com/ai-contests/nav
`;
  }

  /**
   * Test the notification service
   */
  async sendTestEmail(): Promise<NotificationResult> {
    if (!this.config.enabled || !this.resend) {
      return {
        success: false,
        message: 'Notification service not configured',
      };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.config.fromEmail,
        to: this.config.toEmails,
        subject: '✅ AI Contest Navigator - Test Email',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h1>🎉 Test Successful!</h1>
            <p>Your AI Contest Navigator notification system is working correctly.</p>
            <p>You will receive emails when new contests are discovered.</p>
          </div>
        `,
        text: 'Test Successful! Your AI Contest Navigator notification system is working correctly.',
      });

      if (error) {
        logger.error('Resend API error', { error });
        return {
          success: false,
          message: `Test failed: ${error.message}`,
        };
      }

      logger.info('Test email sent successfully', { emailId: data?.id });

      return {
        success: true,
        message: `Test email sent to ${this.config.toEmails.join(', ')} (ID: ${data?.id})`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to send test email', { error: errorMessage });
      return {
        success: false,
        message: `Test failed: ${errorMessage}`,
      };
    }
  }
}
