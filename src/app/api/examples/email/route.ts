/**
 * Email Sending API Route
 * POST /api/examples/email
 *
 * Sends an email using notification templates AND creates an in-app notification.
 * Demonstrates the full notification flow:
 * 1. Email sent via @plyaz/notifications
 * 2. IN_APP notification created for real-time delivery via streaming
 */

import { createNextApiRoute } from '@plyaz/core/frameworks/nextjs';
import type { BackendExampleDomainService } from '@plyaz/core/backend';
import type { SendEmailParams } from '@plyaz/types/notifications';
import { SYSTEM_USER_ID, type NotificationTypeValue } from '@plyaz/types/core';

import { getServerCore, getNotificationsService } from '@/core/server';

export const { POST } = createNextApiRoute<
  BackendExampleDomainService,
  {
    POST: {
      body: SendEmailParams & { createInAppNotification?: boolean; notificationType?: string };
    };
  }
>({
  service: 'example',
  getCore: getServerCore,
  errorSource: 'example-api',
  successMessage: 'Email sent successfully',
  handlers: {
    POST: async (service, { body }) => {
      const { createInAppNotification = true, notificationType = 'SYSTEM', ...emailParams } = body;

      let emailResult: {
        success: boolean;
        data?: { notificationId?: string };
        error?: string | Error;
      };
      let emailError: string | undefined;

      // 1. Try to send the email
      try {
        emailResult = await service.sendEmail(emailParams);
      } catch (error) {
        emailError = error instanceof Error ? error.message : String(error);
        emailResult = { success: false, error: emailError };
      }

      // 2. Create an IN_APP notification if requested (default: true)
      // Always create notification - with success or failure status
      if (createInAppNotification) {
        const notificationsService = await getNotificationsService();
        // Use camelCase to match the validation schema
        await notificationsService.create({
          userId: SYSTEM_USER_ID,
          recipientId: emailParams.recipientId ?? emailParams.to,
          type: notificationType as NotificationTypeValue,
          title: emailResult.success ? 'Email Sent' : 'Email Failed',
          message: emailResult.success
            ? `Email sent to ${emailParams.to}`
            : `Failed to send email to ${emailParams.to}: ${emailError ?? 'Unknown error'}`,
          category: 'transactional',
          channel: 'IN_APP',
          status: emailResult.success ? 'sent' : 'failed',
        });
      }

      return emailResult;
    },
  },
});
