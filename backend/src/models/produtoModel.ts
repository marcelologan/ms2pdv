import db from '../config/database';
import { IProduto } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IProdutoComCategoria extends IProduto {
  categoria_nome?: string;
}

export class ProdutoModel {
  // Lista todos os produtos com filtros opcionais de categoria_id e usuario_id
  static async listAll(filters: { categoria_id?: number; usuario_id?: number } = {}): Promise<IProdutoComCategoria[]> {
    const fields: string[] = [];
    const values: any[] = [];

    if (filters.categoria_id !== undefined) {
      fields.push('p.categoria_id = ?');
      values.push(filters.categoria_id);
    }
    if (filters.usuario_id !== undefined) {
      fields.push('p.usuario_id = ?');
      values.push(filters.usuario_id);
    }

    const whereClause = fields.length > 0 ? `WHERE ${fields.join(' AND ')}` : '';

    const queryStr = `
      SELECT p.id, p.nome, p.preco, p.estoque, p.categoria_id, c.nome as categoria_nome, p.usuario_id 
      FROM produtos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ${whereClause}
    `;

    const [rows] = await db.query<RowDataPacket[]>(queryStr, values);
    return rows as IProdutoComCategoria[];
  }

  // Busca um produto por ID
  static async findById(id: number): Promise<IProdutoComCategoria | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT p.id, p.nome, p.preco, p.estoque, p.categoria_id, c.nome as categoria_nome, p.usuario_id 
       FROM produtos p 
       LEFT JOIN categorias c ON p.categoria_id = c.id 
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0] as IProdutoComCategoria;
  }

  // Busca um produto por Nome (útil para verificar duplicidade)
  static async findByNome(nome: string): Promise<IProduto | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, nome, preco, estoque, categoria_id, usuario_id FROM produtos WHERE nome = ?',
      [nome]
    );
    if (rows.length === 0) return null;
    return rows[0] as IProduto;
  }

  // Cria um novo produto
  static async create(produto: IProduto): Promise<number> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO produtos (nome, preco, estoque, categoria_id, usuario_id) VALUES (?, ?, ?, ?, ?)',
      [produto.nome, produto.preco, produto.estoque ?? null, produto.categoria_id, produto.usuario_id]
    );
    return result.insertId;
  }

  // Cria múltiplos produtos em lote usando uma transação
  static async createMany(produtos: IProduto[]): Promise<number[]> {
    const connection = await db.getConnection();
    const ids: number[] = [];
    try {
      await connection.beginTransaction();
      for (const produto of produtos) {
        const [result] = await connection.query<ResultSetHeader>(
          'INSERT INTO produtos (nome, preco, estoque, categoria_id, usuario_id) VALUES (?, ?, ?, ?, ?)',
          [produto.nome, produto.preco, produto.estoque ?? null, produto.categoria_id, produto.usuario_id]
        );
        ids.push(result.insertId);
      }
      await connection.commit();
      return ids;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Atualiza os dados de um produto
  static async update(id: number, produto: Partial<IProduto>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (produto.nome !== undefined) {
      fields.push('nome = ?');
      values.push(produto.nome);
    }
    if (produto.preco !== undefined) {
      fields.push('preco = ?');
      values.push(produto.preco);
    }
    if (produto.estoque !== undefined) {
      fields.push('estoque = ?');
      values.push(produto.estoque);
    }
    if (produto.categoria_id !== undefined) {
      fields.push('categoria_id = ?');
      values.push(produto.categoria_id);
    }
    if (produto.usuario_id !== undefined) {
      fields.push('usuario_id = ?');
      values.push(produto.usuario_id);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE produtos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Deleta um produto
  static async delete(id: number): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM produtos WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}
