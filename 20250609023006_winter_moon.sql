-- Schema para PostgreSQL
-- Execute este arquivo no seu banco PostgreSQL

-- Criar banco de dados (execute separadamente se necessário)
-- CREATE DATABASE salgados_da_sara;

-- Conectar ao banco salgados_da_sara antes de executar o resto

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    number VARCHAR(20) NOT NULL,
    complement VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    is_portioned BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    customer_data JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    is_delivery BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50) DEFAULT 'cash',
    status VARCHAR(50) DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de status dos pedidos
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS app_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir administrador padrão
INSERT INTO admin_users (username, password, role) 
VALUES ('sara', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;
-- Senha padrão: password

-- Inserir produtos padrão
INSERT INTO products (name, price, category, description, is_portioned, is_custom) VALUES
('Coxinha de Frango', 110.00, 'salgados', 'Coxinha tradicional com recheio de frango desfiado', false, false),
('Coxinha de Frango com Catupiry', 120.00, 'salgados', 'Coxinha de frango com cremoso catupiry', false, false),
('Bolinha de Queijo', 100.00, 'salgados', 'Bolinha crocante recheada com queijo', false, false),
('Risole de Camarão', 130.00, 'salgados', 'Risole recheado com camarão temperado', false, false),
('Pastel de Carne', 90.00, 'salgados', 'Pastel frito com recheio de carne moída', false, false),
('Pastel de Queijo', 85.00, 'salgados', 'Pastel frito com recheio de queijo', false, false),
('Enroladinho de Salsicha', 95.00, 'salgados', 'Massa crocante envolvendo salsicha', false, false),
('Sortido Simples', 95.00, 'sortidos', 'Mix de salgados variados', false, false),
('Sortido Especial', 110.00, 'sortidos', 'Mix premium de salgados especiais', false, false),
('Pão de Açúcar', 100.00, 'assados', 'Pão doce tradicional assado', false, false),
('Pão de Batata', 105.00, 'assados', 'Pão macio com batata', false, false),
('Esfirra de Carne', 120.00, 'assados', 'Esfirra assada com recheio de carne', false, false),
('Esfirra de Queijo', 115.00, 'assados', 'Esfirra assada com recheio de queijo', false, false),
('Torta Salgada', 25.00, 'especiais', 'Fatia de torta salgada', true, false),
('Quiche', 20.00, 'especiais', 'Fatia de quiche', true, false),
('Refrigerante Lata', 5.00, 'opcionais', 'Refrigerante em lata 350ml', true, false),
('Suco Natural', 8.00, 'opcionais', 'Suco natural 300ml', true, false)
ON CONFLICT DO NOTHING;

-- Inserir configurações padrão
INSERT INTO app_config (config_key, config_value) VALUES
('delivery_fee', '10.00'),
('min_order_value', '50.00'),
('store_address', 'RUA IDA BERLET 1738 B'),
('store_phone', '(54) 99999-9999')
ON CONFLICT (config_key) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);