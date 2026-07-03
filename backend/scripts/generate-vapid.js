// generate-vapid.js
// Run this ONCE locally: node generate-vapid.js
// Then paste the output into your Render environment variables.

const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();

console.log('\n=== Copy these into your Render environment variables ===\n');
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('\nAlso set:');
console.log('VAPID_EMAIL=your@email.com');
console.log('\n=========================================================\n');
