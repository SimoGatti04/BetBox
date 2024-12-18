require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const balanceRoutes = require('./routes/balanceRoutes');
const balanceHistoryRoutes = require('./routes/balanceHistoryRoutes');
const dailySpinRoutes = require('./routes/dailySpinRoutes');
const spinHistoryRoutes = require('./routes/spinHistoryRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const { cleanupResources } = require("./services/cleanupService");
const { initializeAllBalanceSchedulers } = require('./utils/balanceSchedulerUtils');
const { initializeAllSpinSchedulers } = require('./utils/dailySpinUtils');
const { scheduleBetCleanup } = require('./utils/betCleanupSchedulerUtils');
const activeBetsRoutes = require('./routes/activeBetsRoutes');
const proxyRoutes = require('./routes/proxyRoutes');
const predictionRoutes = require('./routes/predictionRoutes');

const port = process.env.PORT || 3000;
const WebSocket = require('ws');
const http = require('http');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

global.wss = wss;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'X-Auth-Token', 'Use-Different-Token']
}));

app.options('*', cors());

app.use(express.json());
app.use('/balances', balanceRoutes);
app.use('/balance-history', balanceHistoryRoutes);
app.use('/spin', dailySpinRoutes);
app.use('/verify', verificationRoutes);
app.use('/spin-history', spinHistoryRoutes);
app.use('/bets', activeBetsRoutes);
app.use('/proxy', proxyRoutes);
app.use('/predictions', predictionRoutes.router);

setInterval(cleanupResources, 6 * 60 * 60 * 1000);

function broadcastLog(message) {
  const jsonMessage = JSON.stringify({ type: 'LOG', message });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Nuovo client connesso');

  ws.on('close', () => {
    console.log('Client disconnesso');
  });
});

global.console.log = function(...args) {
  const timestamp = new Date().toLocaleTimeString();
  const message = args.join(' ');
  process.stdout.write(`[${timestamp}] ${message}\n`);
  broadcastLog(`[${timestamp}] ${message}`);
};


server.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
  console.log('Avvio schedulazione recupero saldi e spin giornalieri');
  initializeAllBalanceSchedulers();
  initializeAllSpinSchedulers();
  scheduleBetCleanup();
});
