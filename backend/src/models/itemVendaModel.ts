import db from '../config/database';
import { IItemVenda } from '../types';

export class ItemVendaModel {
  
  // Adicionar um único item a uma venda existente
  static async criar(itemData: IItemVenda): Promise<number> {
    const [result]: any = await db.execute(
      `INSERT INTO itens_venda (quantidade, preco_unitario, vendas_id, produtos_id) 
       VALUES (?, ?, ?, ?)`,
      [
        itemData.quantidade || 1, 
        itemData.preco_unitario || 0, 
        itemData.vendas_id, 
        itemData.produtos_id
      ]
    );
    return result.insertId;
  }

  // Listar todos os itens de uma venda específica
  static async listarPorVenda(vendas_id: number): Promise<IItemVenda[]> {
    const [rows]: any = await db.execute(
      `SELECT * FROM itens_venda WHERE vendas_id = ?`, 
      [vendas_id]
    );
    return rows;
  }

  // Atualizar a quantidade ou preço de um item específico
  static async atualizar(id: number, quantidade: number, preco_unitario: number): Promise<boolean> {
    const [result]: any = await db.execute(
      `UPDATE itens_venda SET quantidade = ?, preco_unitario = ? WHERE id = ?`,
      [quantidade, preco_unitario, id]
    );
    return result.affectedRows > 0;
  }

  // Remover um item de uma venda
  static async deletar(id: number): Promise<boolean> {
    const [result]: any = await db.execute(
      `DELETE FROM itens_venda WHERE id = ?`, 
      [id]
    );
    return result.affectedRows > 0;
  }
}