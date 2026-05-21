require('dotenv').config();
const express = require('express');
const cors = require('cors');

const clientesRoutes = require('./routes/clientesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/', clientesRoutes);

app.listen(PORT, () => {
    console.log(`Microsserviço de Clientes rodando na porta ${PORT}`);
});
