-- =============================================================================
-- Script de Criação do Banco de Dados
-- Projeto: Kamikase / Sistema de Estoque
-- Banco definido no arquivo backend/.env: DB_NAME=sistema_estoque2
-- =============================================================================

-- 1. Criação e seleção do banco de dados
CREATE DATABASE IF NOT EXISTS `sistema_estoque2`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `sistema_estoque2`;

-- =============================================================================
-- 2. Tabela: usuarios
-- Model: backend/src/models/usuarioModel.ts
-- Tipos: backend/src/types/index.ts (IUsuario)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================================
-- 3. Tabela: categorias
-- Model: backend/src/models/categoriaModel.ts
-- Tipos: backend/src/types/index.ts (ICategoria)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- =============================================================================
-- 4. Tabela: produtos
-- Model: backend/src/models/produtoModel.ts
-- Tipos: backend/src/types/index.ts (IProduto)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `produtos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL UNIQUE,
  `preco` DECIMAL(10, 2) NOT NULL,
  `estoque` INT DEFAULT NULL,
  `categoria_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  CONSTRAINT `fk_produtos_categorias`
    FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_produtos_usuarios`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 5. Tabela: Vendas
-- Model: backend/src/models/vendaModel.ts e dashboardModel.ts
-- Tipos: backend/src/types/index.ts (IVenda)
-- Obs: Mantido 'Vendas' com inicial maiúscula conforme referenciado nas queries SQL
-- =============================================================================
CREATE TABLE IF NOT EXISTS `Vendas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome_cliente` VARCHAR(255) DEFAULT NULL,
  `valor_total` DECIMAL(10, 2) DEFAULT 0.00,
  `data_venda` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `usuarios_id` INT NOT NULL,
  CONSTRAINT `fk_vendas_usuarios`
    FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 6. Tabela: itens_venda
-- Model: backend/src/models/itemVendaModel.ts e vendaModel.ts
-- Tipos: backend/src/types/index.ts (IItemVenda)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `itens_venda` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quantidade` INT NOT NULL DEFAULT 1,
  `preco_unitario` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `vendas_id` INT NOT NULL,
  `produtos_id` INT NOT NULL,
  CONSTRAINT `fk_itens_venda_vendas`
    FOREIGN KEY (`vendas_id`) REFERENCES `Vendas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_itens_venda_produtos`
    FOREIGN KEY (`produtos_id`) REFERENCES `produtos` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
