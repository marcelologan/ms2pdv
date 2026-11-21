import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VendaForm, type Produto, type VendaSalva } from '../components/VendaForm';
import { decodificarToken } from '../utils/auth';
import { API_URL } from '../config/api';

// 1. Tipos de dados do módulo de vendas
interface Venda {
    id: number;
    nome_cliente: string | null;
    valor_total: number;
    data_venda: string;
    usuarios_id: number;
}

interface ItemVendaDetalhe {
    id: number;
    quantidade: number;
    preco_unitario: number;
    vendas_id: number;
    produtos_id: number;
}

export function Vendas() {
    const navegar = useNavigate();

    // 2. Estados de dados principais
    const [vendas, setVendas] = useState<Venda[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroGeral, setErroGeral] = useState<string | null>(null);

    // Estados de controle da interface
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // Estados para o Modal de Detalhes da Venda
    const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
    const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
    const [itensVenda, setItensVenda] = useState<ItemVendaDetalhe[]>([]);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
    const [erroDetalhes, setErroDetalhes] = useState<string | null>(null);

    // 3. Carregamento dos dados ao montar o componente
    useEffect(() => {
        let isMounted = true;

        const lidarComErroDeAutenticacao = (status: number) => {
            if (status === 401 || status === 403) {
                alert("Sua sessão expirou por segurança. Por favor, faça login novamente.");
                localStorage.removeItem('ms2pdv_token');
                localStorage.removeItem('ms2pdv_usuario');
                navegar('/');
                return true;
            }
            return false;
        };

        const carregarDadosIniciais = async () => {
            const token = localStorage.getItem('ms2pdv_token');
            if (!token) {
                navegar('/');
                return;
            }

            const payload = decodificarToken(token);
            if (!payload || !payload.id) {
                localStorage.removeItem('ms2pdv_token');
                localStorage.removeItem('ms2pdv_usuario');
                navegar('/');
                return;
            }

            try {
                // Buscamos a lista de vendas e os produtos do usuário em paralelo
                const [respVendas, respProdutos] = await Promise.all([
                    fetch(`${API_URL}/api/vendas`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_URL}/api/produtos/usuario/${payload.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (lidarComErroDeAutenticacao(respVendas.status) || lidarComErroDeAutenticacao(respProdutos.status)) {
                    return;
                }

                if (respVendas.ok && respProdutos.ok) {
                    const dadosVendas = await respVendas.json();
                    const dadosProdutos = await respProdutos.json();

                    if (isMounted) {
                        setVendas(dadosVendas);
                        setProdutos(dadosProdutos);
                    }
                } else {
                    setErroGeral("Falha ao carregar lista de vendas do sistema.");
                }
            } catch (err) {
                console.error("Erro ao carregar dados de vendas:", err);
                setErroGeral("Falha de conexão com a API.");
            } finally {
                if (isMounted) {
                    setCarregando(false);
                }
            }
        };

        carregarDadosIniciais();

        return () => {
            isMounted = false;
        };
    }, [navegar]);

    // 4. Abertura do Modal de Detalhes da Venda
    const abrirDetalhesVenda = async (venda: Venda) => {
        setVendaSelecionada(venda);
        setModalDetalhesAberto(true);
        setCarregandoDetalhes(true);
        setErroDetalhes(null);
        setItensVenda([]);

        const token = localStorage.getItem('ms2pdv_token');

        try {
            const resposta = await fetch(`${API_URL}/api/vendas/${venda.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resposta.ok) {
                const dados = await resposta.json();
                // A API retorna { venda: IVenda, itens: IItemVenda[] }
                setItensVenda(dados.itens || []);
            } else {
                setErroDetalhes("Não foi possível carregar os itens desta venda.");
            }
        } catch {
            setErroDetalhes("Erro de conexão ao buscar os detalhes da venda.");
        } finally {
            setCarregandoDetalhes(false);
        }
    };

    // 5. Inserção imediata da nova venda na lista da tela
    const lidarComVendaSalva = (novaVenda: VendaSalva) => {
        setVendas(prev => [novaVenda, ...prev]);
        setMostrarFormulario(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Auxiliar: Encontra o nome do produto correspondente ao ID
    const obterNomeProduto = (produtoId: number) => {
        const prod = produtos.find(p => p.id === produtoId);
        return prod ? prod.nome : `Produto #${produtoId}`;
    };

    // Formatação de data
    const formatarData = (dataStr: string | null) => {
        if (!dataStr) return '—';
        try {
            const partes = dataStr.split('T')[0].split('-');
            if (partes.length === 3) {
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
            return new Date(dataStr).toLocaleDateString('pt-BR');
        } catch {
            return dataStr;
        }
    };

    // 6. Indicadores Estatísticos Dinâmicos
    const totalVendas = vendas.length;
    const faturamentoTotal = vendas.reduce((acumulado, v) => acumulado + (Number(v.valor_total) || 0), 0);
    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

    // Tela de carregamento
    if (carregando) {
        return (
            <div className="flex justify-center items-center h-64 w-full">
                <p className="text-cyan-400 font-bold animate-pulse text-xl">
                    Carregando dados de vendas do sistema...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl animate-fade-in relative z-10 my-8">
            {/* Cabeçalho da Página */}
            <div className="border-b border-slate-700 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Módulo de Vendas</h2>
                    <p className="text-slate-400 text-sm">Controle de Saídas e Faturamento</p>
                </div>

                <button
                    onClick={() => setMostrarFormulario(!mostrarFormulario)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-bold transition flex items-center space-x-2 text-sm cursor-pointer shadow-lg hover:shadow-cyan-500/20"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mostrarFormulario ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        )}
                    </svg>
                    <span>{mostrarFormulario ? 'Fechar Formulário' : '+ Nova Venda'}</span>
                </button>
            </div>

            {/* Aviso de Erro Geral */}
            {erroGeral && (
                <div className="mb-6 text-red-400 bg-red-400/10 p-4 rounded-lg text-sm border border-red-500/20 text-center font-medium">
                    🔴 {erroGeral}
                </div>
            )}

            {/* Painel Estatístico com 3 Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total de Vendas</h3>
                    <p className="text-3xl sm:text-4xl font-black text-cyan-400 mt-2">{totalVendas}</p>
                    <span className="text-xs text-slate-500 mt-1 block">Pedidos registrados</span>
                </div>

                <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Faturamento Acumulado</h3>
                    <p className="text-3xl sm:text-4xl font-black text-emerald-400 mt-2">
                        R$ {faturamentoTotal.toFixed(2)}
                    </p>
                    <span className="text-xs text-slate-500 mt-1 block">Receita bruta total</span>
                </div>

                <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ticket Médio</h3>
                    <p className="text-3xl sm:text-4xl font-black text-purple-400 mt-2">
                        R$ {ticketMedio.toFixed(2)}
                    </p>
                    <span className="text-xs text-slate-500 mt-1 block">Média por venda</span>
                </div>
            </div>

            {/* Renderização Condicional do Formulário de Cadastro */}
            {mostrarFormulario && (
                <VendaForm
                    produtos={produtos}
                    aoCancelar={() => setMostrarFormulario(false)}
                    aoSalvar={lidarComVendaSalva}
                />
            )}

            {/* Tabela de Vendas Registradas */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Histórico de Vendas</h3>
                <span className="text-xs text-slate-400">{vendas.length} registros</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4 text-right">Valor Total</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 text-sm">
                        {vendas.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <p className="font-semibold">Nenhuma venda registrada ainda.</p>
                                    <p className="text-xs mt-1">Clique em "+ Nova Venda" para emitir seu primeiro pedido.</p>
                                </td>
                            </tr>
                        ) : (
                            vendas.map(venda => (
                                <tr key={venda.id} className="hover:bg-slate-700/50 transition">
                                    <td className="px-6 py-4 font-mono text-cyan-400 font-bold">#{venda.id}</td>
                                    <td className="px-6 py-4 font-semibold text-white">
                                        {venda.nome_cliente || <span className="text-slate-500 italic">Cliente Balcão</span>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {formatarData(venda.data_venda)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-400 font-mono">
                                        R$ {Number(venda.valor_total || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => abrirDetalhesVenda(venda)}
                                            className="bg-slate-900 hover:bg-cyan-600/20 text-cyan-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center space-x-1 cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span>Ver Itens</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Detalhes da Venda */}
            {modalDetalhesAberto && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
                        {/* Topo do Modal */}
                        <div className="flex justify-between items-start border-b border-slate-700 pb-4 mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                                    <span>Venda #{vendaSelecionada?.id}</span>
                                    <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-mono">
                                        Concluída
                                    </span>
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">
                                    Cliente: <strong className="text-slate-200">{vendaSelecionada?.nome_cliente || 'Cliente Balcão'}</strong> | 
                                    Data: <span className="text-slate-300">{formatarData(vendaSelecionada?.data_venda || null)}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setModalDetalhesAberto(false)}
                                className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                                title="Fechar"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Conteúdo: Itens da Venda */}
                        <div className="flex-grow overflow-y-auto pr-1">
                            {carregandoDetalhes ? (
                                <div className="text-center py-12 text-cyan-400 font-bold animate-pulse">
                                    Carregando itens vinculados à venda...
                                </div>
                            ) : erroDetalhes ? (
                                <div className="text-center py-8 text-red-400 bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                                    {erroDetalhes}
                                </div>
                            ) : itensVenda.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    Nenhum item detalhado encontrado para este registro.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-slate-700">
                                    <table className="w-full text-left text-slate-300 text-sm">
                                        <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="px-4 py-3">Produto</th>
                                                <th className="px-4 py-3 text-center">Quantidade</th>
                                                <th className="px-4 py-3 text-right">Preço Unit.</th>
                                                <th className="px-4 py-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {itensVenda.map((item, idx) => {
                                                const subtotal = (item.quantidade || 0) * (item.preco_unitario || 0);
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-700/30">
                                                        <td className="px-4 py-3 font-medium text-white">
                                                            {obterNomeProduto(item.produtos_id)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="bg-slate-900 px-2 py-1 rounded text-xs font-mono text-cyan-400">
                                                                {item.quantidade} un.
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            R$ {Number(item.preco_unitario || 0).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-emerald-400">
                                                            R$ {subtotal.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Rodapé do Modal */}
                        <div className="border-t border-slate-700 pt-4 mt-4 flex justify-between items-center">
                            <div>
                                <span className="text-xs uppercase text-slate-400 block font-semibold">Valor Total do Pedido</span>
                                <span className="text-2xl font-black text-emerald-400 font-mono">
                                    R$ {Number(vendaSelecionada?.valor_total || 0).toFixed(2)}
                                </span>
                            </div>

                            <button
                                onClick={() => setModalDetalhesAberto(false)}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition cursor-pointer"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

