// client-A.js
const ws = new (require('ws'))('ws://localhost:4000');
ws.on('message', m => { if (m == 'A') console.log('EVENT A'); });
