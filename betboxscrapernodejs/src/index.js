require('dotenv').config(); // Importa e configura dotenv
const express = require('express');
const balanceRoutes = require('./routes/balanceRoutes');
const dailySpinRoutes = require('./routes/dailySpinRoutes');
const {cleanupResources} = require("./services/cleanupService");
const app = express();
const port = process.env.PORT || 3000;

app.use('/balances', balanceRoutes);
app.use('/spin', dailySpinRoutes);

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});

setInterval(cleanupResources, 6 * 60 * 60 * 1000);