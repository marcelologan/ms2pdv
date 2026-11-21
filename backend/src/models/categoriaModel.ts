import db from '../config/database';
import { ICategoria } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class CategoriaModel {
  // Lista todas as categorias
  static async listAll(): Promise<ICategoria[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, nome FROM categorias'
    );
    return rows as ICategoria[];
  }

  // Busca uma categoria por ID
  static async findById(id: number): Promise<ICategoria | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, nome FROM categorias WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0] as ICategoria;
  }

  // Busca uma categoria por Nome (útil para verificar duplicidade)
  static async findByNome(nome: string): Promise<ICategoria | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, nome FROM categorias WHERE nome = ?',
      [nome]
    );
    if (rows.length === 0) return null;
    return rows[0] as ICategoria;
  }

  // Cria uma nova categoria
  static async create(categoria: ICategoria): Promise<number> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO categorias (nome) VALUES (?)',
      [categoria.nome]
    );
    return result.insertId;
  }

  // Atualiza os dados de uma categoria
  static async update(id: number, categoria: Partial<ICategoria>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (categoria.nome !== undefined) {
      fields.push('nome = ?');
      values.push(categoria.nome);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE categorias SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Deleta uma categoria
  static async delete(id: number): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM categorias WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}
