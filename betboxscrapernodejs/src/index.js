require('dotenv').config(); // Importa e configura dotenv
const express = require('express');
const balanceRoutes = require('./routes/balanceRoutes');
const dailySpinRoutes = require('./routes/dailySpinRoutes');
const app = express();
const port = process.env.PORT || 3000;

app.use('/balances', balanceRoutes);
app.use('/spin', dailySpinRoutes);

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
