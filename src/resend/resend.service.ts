import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface SendOptions {
  to: string | string[];
  subject: string;
  html: string;
}

@Injectable()
export class ResendService {
  private readonly resend: Resend;
  private readonly logger = new Logger(ResendService.name);
  private readonly from: string;
  private readonly batchSize = 100; // safe default

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined');
    }

    this.resend = new Resend(apiKey);

    this.from =
      this.configService.get<string>('RESEND_FROM') ??
      'No Reply <onboarding@resend.dev>';
  }

  /**
   * Send single email
   */
  async sendOne(options: SendOptions) {
    return this.send(options);
  }

  /**
   * Send bulk email (auto-batched safely)
   */
  async sendBulk(options: SendOptions) {
    if (!Array.isArray(options.to)) {
      return this.send(options);
    }

    const recipients = options.to;

    for (let i = 0; i < recipients.length; i += this.batchSize) {
      const batch = recipients.slice(i, i + this.batchSize);

      await this.send({
        ...options,
        to: batch,
      });
    }

    return { success: true, total: recipients.length };
  }

  /**
   * Internal sender
   */
  private async send({ to, subject, html }: SendOptions) {
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(error);
        throw new Error(error.message);
      }

      return { success: true };
    } catch (err) {
      this.logger.error('Resend send failed', err);
      throw err;
    }
  }

  /**
   * Template-based bulk sender with personalization
   */
  async sendTemplateBulk<T>(
    recipients: { email: string; data: T }[],
    subject: string,
    template: (data: T) => string,
  ) {
    const formatted = recipients.map((r) => ({
      email: r.email,
      html: template(r.data),
    }));

    for (let i = 0; i < formatted.length; i += this.batchSize) {
      const batch = formatted.slice(i, i + this.batchSize);

      await Promise.all(
        batch.map((item) =>
          this.send({
            to: item.email,
            subject,
            html: item.html,
          }),
        ),
      );
    }

    return { success: true, total: formatted.length };
  }
}