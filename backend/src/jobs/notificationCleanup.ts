// Notification Cleanup Job
// Runs daily to delete notifications older than 30 days

import cron from 'node-cron';
import { notificationService } from '../services/notificationService.js';

export function initializeNotificationCleanupJob(): void {
  // Run daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cleanup Job] Starting notification cleanup...');
    
    try {
      const count = await notificationService.deleteOldNotifications(30);
      console.log(`[Cleanup Job] Successfully deleted ${count} old notifications`);
    } catch (error) {
      console.error('[Cleanup Job] Error during notification cleanup:', error);
    }
  });

  console.log('[Cleanup Job] Notification cleanup job scheduled (daily at midnight)');
}
