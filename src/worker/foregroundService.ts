import notifee, {AndroidImportance} from '@notifee/react-native';
import {worker} from './worker';
import {setWorkerEnabled} from '../storage/config';

const CHANNEL_ID = 'sms-worker';
const NOTIFICATION_ID = 'sms-worker-fg';

let channelReady = false;

async function ensureChannel(): Promise<void> {
  if (channelReady) {
    return;
  }
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'SMS Worker',
    importance: AndroidImportance.LOW,
  });
  channelReady = true;
}

/** (Re)display the persistent foreground notification reflecting current worker state. */
async function updateNotification(): Promise<void> {
  const s = worker.getState();
  const body = s.running
    ? `Sending… ${s.counters.sent} sent · ${s.counters.failed} failed`
    : 'Idle';
  try {
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: s.status === 'ONLINE' ? 'SMS Sender — ONLINE' : 'SMS Sender',
      body,
      android: {
        channelId: CHANNEL_ID,
        asForegroundService: true,
        ongoing: true,
        smallIcon: 'ic_launcher',
        importance: AndroidImportance.LOW,
        onlyAlertOnce: true,
      },
    });
  } catch {
    // Notification display can fail if POST_NOTIFICATIONS is denied — the worker
    // still runs; we just can't show progress.
  }
}

/**
 * Registers the foreground-service task. MUST be called once at startup from
 * index.js (outside React) so Android can restart the headless task after a kill.
 */
export function registerForegroundService(): void {
  notifee.registerForegroundService(
    () =>
      new Promise<void>(resolve => {
        worker.setOnProgress(() => {
          updateNotification();
        });
        worker
          .run()
          .catch(() => {})
          .finally(() => {
            worker.setOnProgress(undefined);
            resolve();
          });
      }),
  );
}

/** Starts the worker: persists the enabled flag and brings up the foreground service. */
export async function startWorker(): Promise<void> {
  await ensureChannel();
  await setWorkerEnabled(true);
  worker.setEnabled(true);
  // Displaying a notification with asForegroundService:true starts the service,
  // which invokes the registered task (worker.run()).
  await updateNotification();
}

/** Stops the worker loop, sends OFFLINE heartbeat, and tears down the service. */
export async function stopWorker(): Promise<void> {
  await setWorkerEnabled(false);
  await worker.stop();
  try {
    await notifee.stopForegroundService();
  } catch {
    // already stopped
  }
}
