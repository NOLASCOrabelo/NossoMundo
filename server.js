const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
// O Vercel define a porta automaticamente, ou usa 5000 localmente
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO DO BANCO DE DADOS (Neon / Nuvem)
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false // Obrigatório para conexões seguras na nuvem
    }
});

// --- ROTEADOR (A Mágica acontece aqui) ---
const router = express.Router();

// 1. Rota para PEGAR todos os presentes (GET) -> Agora é /api/gifts
router.get('/gifts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wishlist ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// 2. Rota para CRIAR um presente (POST) -> Agora é /api/gifts
router.post('/gifts', async (req, res) => {
    try {
        const { name, price, image, category } = req.body;
        const newGift = await pool.query(
            'INSERT INTO wishlist (name, price, image, category, done) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, price, image, category, false]
        );
        res.json({ id: newGift.rows[0].id, message: 'Gift created' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao salvar');
    }
});

// 3. Rota para ATUALIZAR status (PUT) -> Agora é /api/gifts/:id/done
router.put('/gifts/:id/done', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE wishlist SET done = NOT done WHERE id = $1', [id]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao atualizar');
    }
});

// 4. Rota para DELETAR (DELETE) -> Agora é /api/gifts/:id
router.delete('/gifts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM wishlist WHERE id = $1', [id]);
        res.json({ message: 'Gift deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao deletar');
    }
});

// Aplica o roteador com o prefixo /api
// Isso significa que todas as rotas acima começam com /api
app.use('/api', router);

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

// Exporta o app para o Vercel (Serverless)
module.exports = app;