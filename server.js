const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

// --- AQUI ESTÁ O SEGREDO ---
// Definimos 4MB. Isso é o limite seguro da Vercel.
// Se passar de 4MB, a Vercel corta. Se for menos, o Express aceita.
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: true }));

// Serve os arquivos da pasta public
app.use(express.static(path.join(process.cwd(), 'public')));

// Banco de Dados
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

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
        
        // Proteção extra no servidor
        if (image && image.length > 4500000) {
            return res.status(413).send('Imagem muito grande para o servidor.');
        }

        const newGift = await pool.query(
            'INSERT INTO wishlist (name, price, image, category, done) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, price, image, category, false]
        );
        res.json({ id: newGift.rows[0].id, message: 'Gift created' });
    } catch (err) {
        console.error("Erro ao salvar:", err.message);
        res.status(500).send('Erro ao salvar no banco');
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

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

module.exports = app;