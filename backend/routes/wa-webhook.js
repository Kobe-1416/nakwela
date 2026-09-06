const express = require('express');

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Meta webhook verification
router.get("/", (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if(mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WhatsApp webhook verified');
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
});

// Receive WhatsApp events
router.post('/', (req, res) => {
    console.log('WhatsApp webhook event:', JSON.stringify(req.body,  null, 2));

    // Acknowledge receipt
    return res.sendStatus(200);

})

module.exports = router;