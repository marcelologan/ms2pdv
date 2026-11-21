import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carrega as variáveis do .env
dotenv.config();

async function runSetup() {
  console.log('🚀 Iniciando configuração do banco de dados...');

  // 1. Garante leitura de DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME exclusivamente de process.env
  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !database) {
    console.error('❌ Erro de configuração: DB_HOST, DB_USER e DB_NAME precisam estar definidos em process.env.');
    process.exit(1);
  }

  // 2. Configuração condicional de SSL (compatível com TiDB Cloud e MySQL local)
  const sslConfig = process.env.DB_SSL === 'true'
    ? { minVersion: 'TLSv1.2' as const, rejectUnauthorized: true }
    : undefined;

  let connection: mysql.Connection | null = null;

  try {
    console.log(`📡 Conectando ao servidor em ${host}:${port} (SSL: ${process.env.DB_SSL === 'true' ? 'Ativo' : 'Desativado'})...`);

    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      ssl: sslConfig,
      multipleStatements: true
    });

    console.log(`✅ Conexão estabelecida com sucesso com o servidor.`);

    // Garante que o banco de dados definido em DB_NAME exista e seja selecionado
    console.log(`📁 Verificando schema do banco de dados '${database}'...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.query(`USE \`${database}\`;`);

    // 3. Execução idempotente do script de criação das tabelas (CREATE TABLE IF NOT EXISTS)
    const bancoSqlPath = path.resolve(__dirname, '../../banco.sql');
    if (fs.existsSync(bancoSqlPath)) {
      console.log(`📄 Executando criação de tabelas: ${bancoSqlPath}`);
      let sqlContent = fs.readFileSync(bancoSqlPath, 'utf8');

      // Adequa dinamicamente a referência do banco caso o DB_NAME seja diferente do padrão
      sqlContent = sqlContent.replace(/`?sistema_estoque2`?/g, `\`${database}\``);

      await connection.query(sqlContent);
      console.log('✅ Tabelas criadas/verificadas com sucesso (todas com CREATE TABLE IF NOT EXISTS)!');
    }

    // 4. Execução do script opcional de seed (idempotente com ON DUPLICATE KEY UPDATE)
    const seedSqlPath = path.resolve(__dirname, '../../seed.sql');
    if (fs.existsSync(seedSqlPath)) {
      console.log(`🌱 Verificando/inserindo dados iniciais: ${seedSqlPath}`);
      let seedContent = fs.readFileSync(seedSqlPath, 'utf8');
      seedContent = seedContent.replace(/`?sistema_estoque2`?/g, `\`${database}\``);

      await connection.query(seedContent);
      console.log('✅ Dados iniciais sincronizados com sucesso!');
    }

    console.log(`🎉 Configuração concluída! Banco '${database}' pronto para uso.`);
  } catch (error: any) {
    console.error('❌ Erro ao configurar o banco de dados:', error.message);
    process.exitCode = 1;
  } finally {
    // 4. Encerramento explícito e seguro da conexão para não travar o terminal
    if (connection) {
      try {
        await connection.end();
        console.log('🔌 Conexão com o banco finalizada com sucesso.');
      } catch (err: any) {
        console.error('Erro ao fechar conexão:', err.message);
      }
    }
    process.exit(process.exitCode || 0);
  }
}

runSetup();
