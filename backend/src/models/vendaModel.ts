import db from '../config/database'; // Importe sua conexão com o BD
import { IVenda, IItemVenda, ICriarVendaPayload } from '../types';

export class VendaModel {
  
  // Criar Venda e Itens de Venda usando Transação
  static async criarVendaComItens(vendaData: ICriarVendaPayload): Promise<number> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Inserir a Venda
      const [vendaResult]: any = await connection.execute(
        `INSERT INTO Vendas (nome_cliente, valor_total, data_venda, usuarios_id) 
         VALUES (?, ?, ?, ?)`,
        [
          vendaData.nome_cliente || null, 
          vendaData.valor_total || 0, 
          vendaData.data_venda || new Date(), 
          vendaData.usuarios_id
        ]
      );
      const vendaId = vendaResult.insertId;

      // 2. Inserir os Itens da Venda
      if (vendaData.itens && vendaData.itens.length > 0) {
        const itensQuery = `INSERT INTO itens_venda (quantidade, preco_unitario, vendas_id, produtos_id) VALUES ?`;
        
        // Mapeando os itens para o formato de bulk insert do SQL
        const itensValues = vendaData.itens.map(item => [
          item.quantidade,
          item.preco_unitario,
          vendaId,
          item.produtos_id
        ]);

        await connection.query(itensQuery, [itensValues]);
      }

      await connection.commit();
      return vendaId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Buscar todas as vendas
  static async listarTodas(): Promise<IVenda[]> {
    const [rows]: any = await db.execute(`SELECT * FROM Vendas`);
    return rows;
  }

  // Buscar uma venda pelo ID com seus itens
  static async buscarPorId(vendaId: number): Promise<{ venda: IVenda, itens: IItemVenda[] } | null> {
    const [vendas]: any = await db.execute(`SELECT * FROM Vendas WHERE id = ?`, [vendaId]);
    
    if (vendas.length === 0) return null;

    const [itens]: any = await db.execute(`SELECT * FROM itens_venda WHERE vendas_id = ?`, [vendaId]);

    return {
      venda: vendas[0],
      itens: itens
    };
  }
}