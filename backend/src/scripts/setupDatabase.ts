import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carrega as variáveis do .env
dotenv.config();

async function runSetup() {
  console.log('🚀 Iniciando configuração do banco de dados MySQL...');

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'sistema_estoque2';

  // Cria conexão inicial sem selecionar o banco para poder criar o schema
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    console.log(`📡 Conectado ao servidor MySQL em ${host}:${port}`);

    // Executa o script de criação das tabelas
    const bancoSqlPath = path.resolve(__dirname, '../../banco.sql');
    if (fs.existsSync(bancoSqlPath)) {
      console.log(`📄 Executando script: ${bancoSqlPath}`);
      const sqlContent = fs.readFileSync(bancoSqlPath, 'utf8');
      await connection.query(sqlContent);
      console.log('✅ Banco de dados e tabelas criados com sucesso!');
    }

    // Executa o script opcional de seed
    const seedSqlPath = path.resolve(__dirname, '../../seed.sql');
    if (fs.existsSync(seedSqlPath)) {
      console.log(`🌱 Inserindo dados iniciais de teste: ${seedSqlPath}`);
      const seedContent = fs.readFileSync(seedSqlPath, 'utf8');
      await connection.query(seedContent);
      console.log('✅ Dados de teste inseridos com sucesso!');
    }

    console.log(`🎉 Configuração concluída! Banco '${database}' pronto para uso.`);
  } catch (error: any) {
    console.error('❌ Erro ao configurar o banco de dados:', error.message);
  } finally {
    await connection.end();
  }
}

runSetup();
