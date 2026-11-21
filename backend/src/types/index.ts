export interface IUsuario {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
}

export interface ICategoria {
  id?: number;
  nome: string;
}

export interface IProduto {
  id?: number;
  nome: string;
  preco: number;
  estoque?: number | null; // Permite null conforme a definição do banco (YES para nulo)
  categoria_id: number;
  usuario_id: number;
}

// interfaces.ts (Adicionar ao final)

export interface IVenda {
  id?: number;
  nome_cliente?: string | null;
  valor_total?: number | null;
  data_venda?: Date | string | null;
  usuarios_id: number;
}

export interface IItemVenda {
  id?: number;
  quantidade?: number | null;
  preco_unitario?: number | null;
  vendas_id: number;
  produtos_id: number;
}

// Interface auxiliar para o Payload de criação da venda (Venda + Itens)
export interface ICriarVendaPayload extends IVenda {
  itens: Omit<IItemVenda, 'id' | 'vendas_id'>[];
}