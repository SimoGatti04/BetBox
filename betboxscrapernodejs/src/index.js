// @.../betboxscrapernodejs/src/index.js

require('dotenv').config(); // Importa e configura dotenv
const express = require('express');
const balanceRoutes = require('./routes/balanceRoutes');
const dailySpinRoutes = require('./routes/dailySpinRoutes');
const spinHistoryRoutes = require('./routes/spinHistoryRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const { cleanupResources } = require("./services/cleanupService");
const scheduleDailyBalanceFetch = require('./utils/balanceScheduler');
const port = process.env.PORT || 3000;
const WebSocket = require('ws');
const http = require('http');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

global.wss = wss;

app.use(express.json());
app.use('/balances', balanceRoutes);
app.use('/spin', dailySpinRoutes);
app.use('/verify', verificationRoutes);
app.use('/spin-history', spinHistoryRoutes);

setInterval(cleanupResources, 6 * 60 * 60 * 1000);

// Funzione per inviare log a tutti i client connessi
function broadcastLog(message) {
  const jsonMessage = JSON.stringify({ type: 'LOG', message });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  });
}

// Gestione delle connessioni WebSocket
wss.on('connection', (ws) => {
  console.log('Nuovo client connesso');

  ws.on('close', () => {
    console.log('Client disconnesso');
  });
});

// Sostituisci tutti i console.log con questa funzione
global.console.log = function(...args) {
  const message = args.join(' ');
  process.stdout.write(message + '\n');
  broadcastLog(message);
};

server.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
  scheduleDailyBalanceFetch(); // Avvia la schedulazione per il recupero del saldo giornaliero
});
