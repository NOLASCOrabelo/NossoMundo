const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path'); // <--- NOVO: Importante para achar os arquivos

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- NOVO: Configura o servidor para mostrar o site estático ---
// Diz para o Express que os arquivos HTML/CSS/Imagens estão na pasta atual
app.use(express.static(path.join(__dirname)));

// CONFIGURAÇÃO DO BANCO DE DADOS
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- ROTEADOR DA API ---
const router = express.Router();

// Suas rotas continuam iguais...
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

// Aplica as rotas da API
app.use('/api', router);

// --- NOVO: Rota de Segurança ---
// Se o Vercel mandar a pessoa para a raiz "/" e não tiver nada,
// o Express força o envio do index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

module.exports = app;