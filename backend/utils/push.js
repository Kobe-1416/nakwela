// utils/push.js

const webpush = require('web-push');

if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@townshipslots.app'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  console.log('Web Push configured.');
} else {
  console.warn(
    'VAPID keys not set — push notifications disabled. Run: node generate-vapid.js'
  );
}

async function sendPush(subscription, payload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    if (err.statusCode === 410) {
      console.log('Push subscription expired.');
    } else {
      console.error('Push error:', err.message);
    }
  }
}

module.exports = {
  sendPush
};