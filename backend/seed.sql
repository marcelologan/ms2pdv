-- =============================================================================
-- Script de Povoamento Inicial (Seed / Dados de Teste)
-- Banco de Dados: sistema_estoque2
-- =============================================================================

USE `sistema_estoque2`;

-- 1. Usuário Administrador de Teste
-- Senha em texto plano: 123456 (hash gerado com bcrypt rounds=10)
INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`) VALUES
(1, 'Administrador', 'admin@email.com', '$2b$10$lP16CqbeXukrTQnyKPw29OF24xiFc/jGbExhzcpsm/wA1glojl4XG')
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

-- 2. Categorias Iniciais
INSERT INTO `categorias` (`id`, `nome`) VALUES
(1, 'Informática'),
(2, 'Periféricos'),
(3, 'Áudio e Vídeo'),
(4, 'Acessórios')
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

-- 3. Produtos Iniciais associados ao usuario 1 e categorias
INSERT INTO `produtos` (`id`, `nome`, `preco`, `estoque`, `categoria_id`, `usuario_id`) VALUES
(1, 'Teclado Mecânico RGB', 250.00, 15, 2, 1),
(2, 'Mouse Gamer 7200 DPI', 120.00, 25, 2, 1),
(3, 'Monitor 24 Polegadas IPS', 850.00, 8, 3, 1),
(4, 'Headset Surround 7.1', 320.00, 12, 3, 1),
(5, 'Mousepad Extra Grande', 60.00, 4, 1, 1),
(6, 'Hub USB 3.0 4 Portas', 45.00, 30, 4, 1)
ON DUPLICATE KEY UPDATE `preco` = VALUES(`preco`), `estoque` = VALUES(`estoque`);

-- 4. Vendas Iniciais de Exemplo
INSERT INTO `Vendas` (`id`, `nome_cliente`, `valor_total`, `data_venda`, `usuarios_id`) VALUES
(1, 'Carlos Silva', 370.00, NOW() - INTERVAL 2 DAY, 1),
(2, 'Mariana Souza', 850.00, NOW() - INTERVAL 1 DAY, 1),
(3, 'João Pereira', 180.00, NOW(), 1)
ON DUPLICATE KEY UPDATE `valor_total` = VALUES(`valor_total`);

-- 5. Itens das Vendas
INSERT INTO `itens_venda` (`id`, `quantidade`, `preco_unitario`, `vendas_id`, `produtos_id`) VALUES
-- Venda 1: 1 Teclado (250) + 1 Mouse (120) = 370
(1, 1, 250.00, 1, 1),
(2, 1, 120.00, 1, 2),
-- Venda 2: 1 Monitor (850) = 850
(3, 1, 850.00, 2, 3),
-- Venda 3: 1 Mouse (120) + 1 Mousepad (60) = 180
(4, 1, 120.00, 3, 2),
(5, 1, 60.00, 3, 5)
ON DUPLICATE KEY UPDATE `quantidade` = VALUES(`quantidade`), `preco_unitario` = VALUES(`preco_unitario`);
