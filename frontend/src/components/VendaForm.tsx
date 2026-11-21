import { useState } from 'react';
import { decodificarToken } from '../utils/auth';

// 1. Tipamos os dados necessários para o componente
export interface Produto {
    id: number;
    nome: string;
    preco: number;
    estoque: number;
    categoria_id: number;
}

export interface ItemCarrinho {
    produtos_id: number;
    nome_produto: string;
    quantidade: number;
    preco_unitario: number;
    estoque_maximo: number;
}

export interface VendaSalva {
    id: number;
    nome_cliente: string | null;
    valor_total: number;
    data_venda: string;
    usuarios_id: number;
}

interface VendaFormProps {
    produtos: Produto[];
    aoSalvar: (novaVenda: VendaSalva) => void;
    aoCancelar: () => void;
}

export function VendaForm({ produtos, aoSalvar, aoCancelar }: VendaFormProps) {
    // 2. Estados dos dados da Venda
    const [nomeCliente, setNomeCliente] = useState('');
    const [dataVenda, setDataVenda] = useState(() => new Date().toISOString().split('T')[0]);
    const [itens, setItens] = useState<ItemCarrinho[]>([]);

    // Estados para o item sendo adicionado no momento
    const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<string>('');
    const [quantidadeItem, setQuantidadeItem] = useState<number>(1);
    const [precoUnitarioItem, setPrecoUnitarioItem] = useState<string>('');

    // Estados de controle e feedback
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Quando o usuário escolhe um produto no select, auto-preenchemos o preço
    const lidarComMudancaProduto = (idStr: string) => {
        setProdutoSelecionadoId(idStr);
        setErro(null);

        const prod = produtos.find(p => p.id === parseInt(idStr));
        if (prod) {
            setPrecoUnitarioItem(Number(prod.preco).toFixed(2));
            setQuantidadeItem(1);
        } else {
            setPrecoUnitarioItem('');
        }
    };

    // Adiciona o item configurado na cesta da venda
    const adicionarItem = () => {
        setErro(null);

        const idNum = parseInt(produtoSelecionadoId);
        if (isNaN(idNum) || !produtoSelecionadoId) {
            setErro("Selecione um produto para adicionar à venda.");
            return;
        }

        const produto = produtos.find(p => p.id === idNum);
        if (!produto) {
            setErro("Produto selecionado não encontrado.");
            return;
        }

        const precoUnit = parseFloat(precoUnitarioItem);
        if (isNaN(precoUnit) || precoUnit <= 0) {
            setErro("O preço unitário deve ser maior que zero.");
            return;
        }

        if (quantidadeItem <= 0) {
            setErro("A quantidade deve ser de pelo menos 1 unidade.");
            return;
        }

        // Verifica se o item já existe no carrinho para somar a quantidade
        const itemExistenteIndex = itens.findIndex(i => i.produtos_id === idNum);

        if (itemExistenteIndex >= 0) {
            const novaQtd = itens[itemExistenteIndex].quantidade + quantidadeItem;
            if (novaQtd > produto.estoque) {
                setErro(`Quantidade excede o estoque disponível (${produto.estoque} un.) para "${produto.nome}".`);
                return;
            }

            const novosItens = [...itens];
            novosItens[itemExistenteIndex] = {
                ...novosItens[itemExistenteIndex],
                quantidade: novaQtd,
                preco_unitario: precoUnit
            };
            setItens(novosItens);
        } else {
            if (quantidadeItem > produto.estoque) {
                setErro(`Quantidade solicitada (${quantidadeItem}) excede o estoque atual (${produto.estoque} un.).`);
                return;
            }

            setItens([
                ...itens,
                {
                    produtos_id: produto.id,
                    nome_produto: produto.nome,
                    quantidade: quantidadeItem,
                    preco_unitario: precoUnit,
                    estoque_maximo: produto.estoque
                }
            ]);
        }

        // Reseta os campos de seleção rápida
        setProdutoSelecionadoId('');
        setPrecoUnitarioItem('');
        setQuantidadeItem(1);
    };

    // Remove um item do carrinho
    const removerItem = (index: number) => {
        setItens(itens.filter((_, i) => i !== index));
    };

    // Calcula o valor total somando todos os subtotais dos itens
    const valorTotalCalculado = itens.reduce((total, item) => {
        return total + (item.quantidade * item.preco_unitario);
    }, 0);

    // Submissão da Venda completa para a API
    const lidarComSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(null);

        if (itens.length === 0) {
            setErro("A venda precisa conter pelo menos um produto adicionado.");
            return;
        }

        const token = localStorage.getItem('ms2pdv_token');
        if (!token) {
            setErro("Sessão expirada. Faça login novamente.");
            return;
        }

        const payloadToken = decodificarToken(token);
        if (!payloadToken || !payloadToken.id) {
            setErro("Credenciais inválidas. Faça login novamente.");
            return;
        }

        setCarregando(true);

        try {
            const resposta = await fetch('http://localhost:3000/api/vendas/cadastrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome_cliente: nomeCliente.trim() || 'Cliente Balcão',
                    valor_total: valorTotalCalculado,
                    data_venda: dataVenda,
                    usuarios_id: payloadToken.id,
                    itens: itens.map(item => ({
                        produtos_id: item.produtos_id,
                        quantidade: item.quantidade,
                        preco_unitario: item.preco_unitario
                    }))
                })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                aoSalvar({
                    id: dados.vendaId,
                    nome_cliente: nomeCliente.trim() || 'Cliente Balcão',
                    valor_total: valorTotalCalculado,
                    data_venda: dataVenda,
                    usuarios_id: payloadToken.id
                });
            } else {
                setErro(dados.error || dados.erro || "Erro ao registrar a venda.");
            }
        } catch {
            setErro("Falha de comunicação com o servidor.");
        } finally {
            setCarregando(false);
        }
    };

    return (
        <form onSubmit={lidarComSubmit} className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8 shadow-xl animate-fade-in">
            <div className="border-b border-slate-700 pb-4 mb-6">
                <h3 className="text-2xl font-bold text-cyan-400">Registrar Nova Venda</h3>
                <p className="text-slate-400 text-sm">Adicione os produtos comercializados e conclua o lançamento.</p>
            </div>

            {erro && (
                <div className="mb-6 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-500/20 flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>{erro}</span>
                </div>
            )}

            {/* Cabeçalho da Venda: Cliente e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-slate-400 text-xs uppercase font-bold mb-1">
                        Nome do Cliente (Opcional)
                    </label>
                    <input
                        type="text"
                        placeholder="Ex: João da Silva / Cliente Balcão"
                        value={nomeCliente}
                        onChange={e => setNomeCliente(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none transition"
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-xs uppercase font-bold mb-1">
                        Data da Venda
                    </label>
                    <input
                        type="date"
                        required
                        value={dataVenda}
                        onChange={e => setDataVenda(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none transition"
                    />
                </div>
            </div>

            {/* Seletor Rápido de Itens */}
            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/80 mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
                    <span>Adicionar Produtos à Cesta</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-5">
                        <label className="block text-slate-400 text-xs uppercase mb-1">Produto</label>
                        <select
                            value={produtoSelecionadoId}
                            onChange={e => lidarComMudancaProduto(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none text-sm"
                        >
                            <option value="">Selecione o produto...</option>
                            {produtos.map(p => (
                                <option key={p.id} value={p.id} disabled={p.estoque <= 0}>
                                    {p.nome} — R$ {Number(p.preco).toFixed(2)} ({p.estoque > 0 ? `${p.estoque} em estoque` : 'Esgotado'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-slate-400 text-xs uppercase mb-1">Qtd</label>
                        <input
                            type="number"
                            min="1"
                            value={quantidadeItem}
                            onChange={e => setQuantidadeItem(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none text-sm"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-slate-400 text-xs uppercase mb-1">Preço Unit. (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={precoUnitarioItem}
                            onChange={e => setPrecoUnitarioItem(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="button"
                            onClick={adicionarItem}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg font-bold text-sm transition flex items-center justify-center space-x-1 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Incluir</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Listagem dos Itens do Carrinho */}
            <div className="mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
                    Itens da Venda ({itens.length})
                </h4>

                {itens.length === 0 ? (
                    <div className="text-center py-8 bg-slate-900/40 rounded-lg border border-dashed border-slate-700 text-slate-500 text-sm">
                        Nenhum produto incluído nesta venda ainda. Selecione um item acima.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-700">
                        <table className="w-full text-left text-slate-300 text-sm">
                            <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3 text-center">Quantidade</th>
                                    <th className="px-4 py-3 text-right">Preço Unit.</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                    <th className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {itens.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-700/40 transition">
                                        <td className="px-4 py-3 font-semibold text-white">{item.nome_produto}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-slate-900 px-2 py-1 rounded text-xs font-mono text-cyan-400">
                                                {item.quantidade} un.
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            R$ {Number(item.preco_unitario).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-400">
                                            R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removerItem(idx)}
                                                className="text-red-400 hover:text-red-300 text-xs font-bold transition p-1 hover:bg-red-500/10 rounded cursor-pointer"
                                                title="Remover item"
                                            >
                                                Remover
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Rodapé com Resumo Financeiro e Ações */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-700 pt-6 gap-4">
                <div className="text-center sm:text-left">
                    <span className="text-slate-400 text-xs uppercase font-bold block">Valor Total da Venda</span>
                    <span className="text-3xl font-black text-emerald-400">
                        R$ {valorTotalCalculado.toFixed(2)}
                    </span>
                </div>

                <div className="flex space-x-3 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={aoCancelar}
                        disabled={carregando}
                        className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition text-sm font-semibold cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={carregando || itens.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-bold transition text-sm shadow-lg hover:shadow-emerald-500/20 cursor-pointer flex items-center space-x-2"
                    >
                        {carregando ? (
                            <>
                                <span className="animate-spin text-sm">🔄</span>
                                <span>Processando...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Concluir Venda</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}

