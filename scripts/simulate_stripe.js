
const http = require('http');

const projectId = 'ce91debe-7d13-4e4c-a116-29116e0339d6';
const clientId = '93d567c9-1662-43c7-97d8-8547ca543888';

const mockEvent = {
    id: 'evt_test_webhook_' + Date.now(),
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
        object: {
            id: 'cs_test_' + Date.now(),
            object: 'checkout.session',
            amount_total: 500000,
            currency: 'xof',
            payment_status: 'paid',
            status: 'complete',
            metadata: {
                project_id: projectId,
                client_id: clientId,
                env: 'simulation'
            },
            invoice: 'in_test_123456'
        }
    }
};

const payload = JSON.stringify(mockEvent);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhooks/stripe',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-stripe-simulate-bypass': 'true'
    }
};

console.log(`🚀 Sending Simulation to ${options.hostname}:${options.port}${options.path}`);
console.log(`🎯 Project: ${projectId}`);

const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`📦 Body: ${data}`);
        if (res.statusCode === 200) {
            console.log("✅ SUCCESS! Webhook processed the event.");
        } else {
            console.error("❌ FAILED. Check server logs.");
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request Error: ${e.message}`);
});

req.write(payload);
req.end();
