import db from '../config/database';
import { IUsuario } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class UsuarioModel {
  // Lista todos os usuários (sem expor a senha)
  static async listAll(): Promise<IUsuario[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, nome, email FROM usuarios'
    );
    return rows as IUsuario[];
  }

  // Busca um usuário por ID (sem expor a senha)
  static async findById(id: number): Promise<IUsuario | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, nome, email FROM usuarios WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0] as IUsuario;
  }

  // Busca um usuário por E-mail (útil para verificar duplicidade ou login)
  static async findByEmail(email: string): Promise<IUsuario | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, nome, email, senha FROM usuarios WHERE email = ?',
      [email]
    );
    if (rows.length === 0) return null;
    return rows[0] as IUsuario;
  }

  // Cria um novo usuário
  static async create(usuario: IUsuario): Promise<number> {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [usuario.nome, usuario.email, usuario.senha]
    );
    return result.insertId;
  }

  // Atualiza os dados de um usuário
  static async update(id: number, usuario: Partial<IUsuario>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (usuario.nome !== undefined) {
      fields.push('nome = ?');
      values.push(usuario.nome);
    }
    if (usuario.email !== undefined) {
      fields.push('email = ?');
      values.push(usuario.email);
    }
    if (usuario.senha !== undefined) {
      fields.push('senha = ?');
      values.push(usuario.senha);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Deleta um usuário
  static async delete(id: number): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}
