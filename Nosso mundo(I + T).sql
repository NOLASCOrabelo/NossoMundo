create table wishlist(
id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price VARCHAR(20),
    image TEXT, -- Vamos salvar a string Base64 aqui por enquanto (simples)
    category VARCHAR(50),
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    
    CREATE TABLE reasons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50),      -- Ex: "Seu Sorriso"
    description TEXT,       -- Ex: "Sempre que você sorri..."
    icon_name VARCHAR(50),  -- Ex: "Stitch.svg"
    card_color VARCHAR(20)  -- Ex: "rosa-card" ou "blue-card"
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),       -- Ex: "casa", "tech", "exp"
    budget_limit DECIMAL(10,2) 
);