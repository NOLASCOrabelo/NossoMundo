const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

// 1. Aumenta limite para 4MB (Limite seguro do Vercel Grátis)
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: true }));

// 2. Entrega o Site (Arquivos Estáticos)
// O Express vai procurar index.html, styles.css e script.js aqui
app.use(express.static(path.join(process.cwd(), 'public')));

// 3. Banco de Dados
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

// 4. Rotas da API
const router = express.Router();

router.get('/gifts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wishlist ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.post('/gifts', async (req, res) => {
    try {
        const { name, price, image, category } = req.body;
        
        // Proteção silenciosa: se passar de 4.5MB, avisa
        if (image && image.length > 4500000) {
            return res.status(413).send('Imagem muito grande.');
        }

        const newGift = await pool.query(
            'INSERT INTO wishlist (name, price, image, category, done) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, price, image, category, false]
        );
        res.json({ id: newGift.rows[0].id, message: 'Gift created' });
    } catch (err) {
        console.error("Erro ao salvar:", err.message);
        res.status(500).send('Erro ao salvar');
    }
});

router.put('/gifts/:id/done', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE wishlist SET done = NOT done WHERE id = $1', [id]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).send('Erro ao atualizar');
    }
});

router.delete('/gifts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM wishlist WHERE id = $1', [id]);
        res.json({ message: 'Gift deleted' });
    } catch (err) {
        res.status(500).send('Erro ao deletar');
    }
});

app.use('/api', router);

// --- SEM ROTA app.get NO FINAL ---
// Removemos a causa do erro 500.
// Se o arquivo não existir na pasta public, dará 404 normal, sem derrubar o site.

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

module.exports = app;