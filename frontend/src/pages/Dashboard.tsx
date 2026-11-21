import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProdutoForm } from '../components/ProdutoForm';
import { DashboardCharts, type IEvolucaoVenda, type IVendaCategoria } from '../components/DashboardCharts';
import { decodificarToken } from '../utils/auth';
import { API_URL } from '../config/api';
export type { IEvolucaoVenda, IVendaCategoria };

// 1. Tipos de dados do Dashboard e Inventário
interface Categoria {
    id: number;
    nome: string;
}

interface Produto {
    id: number;
    nome: string;
    preco: number;
    estoque: number;
    categoria_id: number;
}

interface CardsData {
    totalProdutos: number;
    totalCategorias: number;
    valorTotalEstoque: number;
    totalVendas: number;
    faturamentoTotal: number;
}

interface UltimoVendido {
    id: number;
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    total: number;
    data_venda: string;
    nome_cliente: string | null;
}

interface MaisVendido {
    id: number;
    produto_nome: string;
    total_vendido: number;
    total_faturado: number;
}

interface MenorEstoque {
    id: number;
    nome: string;
    estoque: number;
    preco: number;
    categoria_nome: string | null;
}

export function Dashboard() {
    const navegar = useNavigate();

    // 2. Controle de Abas: Visão Analítica (Dashboard) vs Gestão de Inventário (Produtos)
    const [abaAtiva, setAbaAtiva] = useState<'analytics' | 'inventario'>('analytics');

    // Estados dos Cards e Gráficos Analíticos
    const [cards, setCards] = useState<CardsData>({
        totalProdutos: 0,
        totalCategorias: 0,
        valorTotalEstoque: 0,
        totalVendas: 0,
        faturamentoTotal: 0
    });
    const [evolucaoVendas, setEvolucaoVendas] = useState<IEvolucaoVenda[]>([]);
    const [vendasPorCategoria, setVendasPorCategoria] = useState<IVendaCategoria[]>([]);
    const [ultimosVendidos, setUltimosVendidos] = useState<UltimoVendido[]>([]);
    const [maisVendidos, setMaisVendidos] = useState<MaisVendido[]>([]);
    const [menorEstoque, setMenorEstoque] = useState<MenorEstoque[]>([]);

    // Estados do Inventário (CRUD original)
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);

    // Estados de Controle e Filtro de Datas
    const [tipoFiltro, setTipoFiltro] = useState<'mes' | 'periodo'>('mes');
    const [mesFiltro, setMesFiltro] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [dataInicio, setDataInicio] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);

    // Estados de Carregamento e Erros
    const [carregandoGeral, setCarregandoGeral] = useState(true);
    const [atualizandoFiltro, setAtualizandoFiltro] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // 3. Ejeção de segurança em caso de sessão inválida
    const lidarComErroDeAutenticacao = useCallback((status: number) => {
        if (status === 401 || status === 403) {
            alert("Sua sessão expirou por segurança. Por favor, faça login novamente.");
            localStorage.removeItem('ms2pdv_token');
            localStorage.removeItem('ms2pdv_usuario');
            navegar('/');
            return true;
        }
        return false;
    }, [navegar]);

    // 4. Carregar Dados Analíticos do Dashboard (com base nos filtros)
    const carregarDadosDashboard = useCallback(async (ignorarSpinnerGeral = false) => {
        const token = localStorage.getItem('ms2pdv_token');
        if (!token) {
            navegar('/');
            return;
        }

        if (!ignorarSpinnerGeral) setCarregandoGeral(true);
        setAtualizandoFiltro(true);
        setErro(null);

        try {
            // Monta query params com base na escolha do filtro
            let queryUrl = `${API_URL}/api/dashboard`;
            if (tipoFiltro === 'mes' && mesFiltro) {
                queryUrl += `?mes=${mesFiltro}`;
            } else if (tipoFiltro === 'periodo' && dataInicio && dataFim) {
                queryUrl += `?data_inicio=${dataInicio}&data_fim=${dataFim}`;
            }

            const resposta = await fetch(queryUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (lidarComErroDeAutenticacao(resposta.status)) return;

            if (resposta.ok) {
                const dados = await resposta.json();
                if (dados.cards) setCards(dados.cards);
                if (dados.graficos) {
                    setEvolucaoVendas(dados.graficos.evolucaoVendas || []);
                    setVendasPorCategoria(dados.graficos.vendasPorCategoria || []);
                }
                setUltimosVendidos(dados.ultimosVendidos || []);
                setMaisVendidos(dados.maisVendidos || []);
                setMenorEstoque(dados.menorEstoque || []);
            } else {
                setErro("Não foi possível obter os dados do dashboard analítico.");
            }
        } catch (err) {
            console.error("Erro ao carregar dashboard:", err);
            setErro("Falha de comunicação com a API do Dashboard.");
        } finally {
            setCarregandoGeral(false);
            setAtualizandoFiltro(false);
        }
    }, [tipoFiltro, mesFiltro, dataInicio, dataFim, lidarComErroDeAutenticacao, navegar]);

    // 5. Carregar Dados do Estoque (para a aba de Inventário)
    const carregarInventario = useCallback(async () => {
        const token = localStorage.getItem('ms2pdv_token');
        if (!token) return;

        const payload = decodificarToken(token);
        if (!payload || !payload.id) return;

        try {
            const [respProdutos, respCategorias] = await Promise.all([
                fetch(`${API_URL}/api/produtos/usuario/${payload.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/api/categorias`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (lidarComErroDeAutenticacao(respProdutos.status) || lidarComErroDeAutenticacao(respCategorias.status)) return;

            if (respProdutos.ok && respCategorias.ok) {
                const dadosProds = await respProdutos.json();
                const dadosCats = await respCategorias.json();
                setProdutos(dadosProds);
                setCategorias(dadosCats);
            }
        } catch (err) {
            console.error("Erro ao carregar inventário:", err);
        }
    }, [lidarComErroDeAutenticacao]);

    // Inicialização da tela
    useEffect(() => {
        carregarDadosDashboard();
        carregarInventario();
    }, [carregarDadosDashboard, carregarInventario]);

    // Atalhos Rápidos de Data
    const aplicarAtalho = (opcao: 'mes_atual' | 'ultimos_30' | 'ultimos_7' | 'ano_atual') => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mesStr = String(hoje.getMonth() + 1).padStart(2, '0');
        const hojeStr = hoje.toISOString().split('T')[0];

        if (opcao === 'mes_atual') {
            setTipoFiltro('mes');
            setMesFiltro(`${ano}-${mesStr}`);
        } else if (opcao === 'ultimos_30') {
            setTipoFiltro('periodo');
            const d30 = new Date();
            d30.setDate(hoje.getDate() - 30);
            setDataInicio(d30.toISOString().split('T')[0]);
            setDataFim(hojeStr);
        } else if (opcao === 'ultimos_7') {
            setTipoFiltro('periodo');
            const d7 = new Date();
            d7.setDate(hoje.getDate() - 7);
            setDataInicio(d7.toISOString().split('T')[0]);
            setDataFim(hojeStr);
        } else if (opcao === 'ano_atual') {
            setTipoFiltro('periodo');
            setDataInicio(`${ano}-01-01`);
            setDataFim(hojeStr);
        }
    };

    // Funções de Ação do CRUD de Produtos (Inventário)
    const salvarProdutoNaTela = (produtoSalvo: Produto) => {
        if (produtoEmEdicao) {
            setProdutos(produtos.map(p => p.id === produtoSalvo.id ? produtoSalvo : p));
        } else {
            setProdutos([...produtos, produtoSalvo]);
        }
        setProdutoEmEdicao(null);
        setMostrarFormulario(false);
        // Atualiza os dados do dashboard analítico
        carregarDadosDashboard(true);
    };

    const iniciarEdicao = (produto: Produto) => {
        setProdutoEmEdicao(produto);
        setMostrarFormulario(true);
        setAbaAtiva('inventario');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deletarProduto = async (id: number, nomeProduto: string) => {
        const confirmacao = window.confirm(`ATENÇÃO! Tem certeza que deseja excluir o produto "${nomeProduto}"?`);
        if (!confirmacao) return;

        const token = localStorage.getItem('ms2pdv_token');
        try {
            const resposta = await fetch(`${API_URL}/api/produtos/excluir/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resposta.ok) {
                setProdutos(produtos.filter(p => p.id !== id));
                carregarDadosDashboard(true);
                alert("Produto excluído com sucesso.");
            } else {
                alert("Erro ao excluir o produto. Ele pode estar vinculado a vendas.");
            }
        } catch {
            alert("Falha de comunicação com o servidor.");
        }
    };

    // Formatação de data simples
    const formatarData = (dataStr: string | null) => {
        if (!dataStr) return '—';
        try {
            const partes = dataStr.split('T')[0].split('-');
            if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
            return new Date(dataStr).toLocaleDateString('pt-BR');
        } catch {
            return dataStr;
        }
    };

    // Spinner Inicial
    if (carregandoGeral) {
        return (
            <div className="flex flex-col justify-center items-center h-72 w-full space-y-4">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-cyan-400 font-bold animate-pulse text-lg">
                    Consolidando Métricas e Inteligência do Estoque...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-2xl animate-fade-in relative z-10 my-6 space-y-8">
            {/* Cabeçalho com Título e Alternador de Abas */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-5 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center space-x-3">
                        <span>Painel de Controle</span>
                        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-normal">
                            Analítico
                        </span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-0.5">Métricas em tempo real, fluxo financeiro e inventário</p>
                </div>

                {/* Abas Superiores */}
                <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-700 shadow-inner">
                    <button
                        onClick={() => setAbaAtiva('analytics')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center space-x-2 cursor-pointer ${
                            abaAtiva === 'analytics'
                                ? 'bg-cyan-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Visão Analítica</span>
                    </button>

                    <button
                        onClick={() => setAbaAtiva('inventario')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center space-x-2 cursor-pointer ${
                            abaAtiva === 'inventario'
                                ? 'bg-cyan-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span>Gerenciar Estoque ({produtos.length})</span>
                    </button>
                </div>
            </div>

            {/* Mensagem de Erro */}
            {erro && (
                <div className="text-red-400 bg-red-400/10 p-4 rounded-lg text-sm border border-red-500/20 text-center font-medium">
                    🔴 {erro}
                </div>
            )}

            {/* ========================================================= */}
            {/* ABA 1: VISÃO ANALÍTICA (DASHBOARD COMPLETO)               */}
            {/* ========================================================= */}
            {abaAtiva === 'analytics' && (
                <div className="space-y-8 animate-fade-in">
                    {/* 1. CARDS HORIZONTAIS NO TOPO COM NÚMEROS ABSOLUTOS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Card 1: Total de Produtos */}
                        <div className="bg-slate-900 p-5 rounded-xl border border-slate-700/80 shadow-md relative overflow-hidden group hover:border-cyan-500/50 transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                                        Produtos Cadastrados
                                    </span>
                                    <p className="text-3xl font-black text-cyan-400 mt-2 font-mono">
                                        {cards.totalProdutos}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-3 block">Total em catálogo</span>
                        </div>

                        {/* Card 2: Categorias */}
                        <div className="bg-slate-900 p-5 rounded-xl border border-slate-700/80 shadow-md relative overflow-hidden group hover:border-purple-500/50 transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                                        Categorias Ativas
                                    </span>
                                    <p className="text-3xl font-black text-purple-400 mt-2 font-mono">
                                        {cards.totalCategorias}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-3 block">Segmentos configurados</span>
                        </div>

                        {/* Card 3: Valor Total de Produtos em Estoque (sum(estoque * preco)) */}
                        <div className="bg-slate-900 p-5 rounded-xl border border-slate-700/80 shadow-md relative overflow-hidden group hover:border-emerald-500/50 transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                                        Valor Total em Estoque
                                    </span>
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 font-mono truncate">
                                        R$ {Number(cards.valorTotalEstoque).toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-3 block">Σ (quantidade × preço de venda)</span>
                        </div>

                        {/* Card 4: Total de Vendas */}
                        <div className="bg-slate-900 p-5 rounded-xl border border-slate-700/80 shadow-md relative overflow-hidden group hover:border-amber-500/50 transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                                        Total de Vendas
                                    </span>
                                    <p className="text-3xl font-black text-amber-400 mt-2 font-mono">
                                        {cards.totalVendas}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-3 block">
                                Faturamento: <strong className="text-slate-300">R$ {Number(cards.faturamentoTotal).toFixed(2)}</strong>
                            </span>
                        </div>
                    </div>

                    {/* 2. FILTRO DE DATA (MÊS OU INÍCIO E FIM) */}
                    <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 shadow-md">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            {/* Alternador do Modo de Filtro */}
                            <div className="flex items-center space-x-2">
                                <span className="text-xs uppercase font-bold text-slate-400 mr-2 flex items-center space-x-1">
                                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    <span>Filtrar Período:</span>
                                </span>

                                <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex text-xs">
                                    <button
                                        onClick={() => setTipoFiltro('mes')}
                                        className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                                            tipoFiltro === 'mes' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Por Mês
                                    </button>
                                    <button
                                        onClick={() => setTipoFiltro('periodo')}
                                        className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                                            tipoFiltro === 'periodo' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Data Início & Fim
                                    </button>
                                </div>
                            </div>

                            {/* Inputs de Data Dinâmicos */}
                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                {tipoFiltro === 'mes' ? (
                                    <div className="flex items-center space-x-2">
                                        <label className="text-xs text-slate-400 font-semibold">Mês:</label>
                                        <input
                                            type="month"
                                            value={mesFiltro}
                                            onChange={e => setMesFiltro(e.target.value)}
                                            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center space-x-1.5">
                                            <label className="text-xs text-slate-400 font-semibold">De:</label>
                                            <input
                                                type="date"
                                                value={dataInicio}
                                                onChange={e => setDataInicio(e.target.value)}
                                                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-1.5">
                                            <label className="text-xs text-slate-400 font-semibold">Até:</label>
                                            <input
                                                type="date"
                                                value={dataFim}
                                                onChange={e => setDataFim(e.target.value)}
                                                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => carregarDadosDashboard(true)}
                                    disabled={atualizandoFiltro}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {atualizandoFiltro ? (
                                        <span className="animate-spin text-xs">🔄</span>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    )}
                                    <span>Aplicar</span>
                                </button>
                            </div>
                        </div>

                        {/* Atalhos Rápidos */}
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
                            <span className="text-slate-500 text-[11px] uppercase font-bold mr-1">Atalhos:</span>
                            <button
                                onClick={() => { aplicarAtalho('mes_atual'); carregarDadosDashboard(true); }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
                            >
                                Mês Atual
                            </button>
                            <button
                                onClick={() => { aplicarAtalho('ultimos_7'); carregarDadosDashboard(true); }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
                            >
                                Últimos 7 dias
                            </button>
                            <button
                                onClick={() => { aplicarAtalho('ultimos_30'); carregarDadosDashboard(true); }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
                            >
                                Últimos 30 dias
                            </button>
                            <button
                                onClick={() => { aplicarAtalho('ano_atual'); carregarDadosDashboard(true); }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
                            >
                                Ano Atual
                            </button>
                        </div>
                    </div>

                    {/* 3. GRÁFICOS E LISTAS LATERAIS (ÚLTIMOS VENDIDOS & MAIS VENDIDOS) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Coluna Esquerda: Gráficos (8 cols) */}
                        <div className="lg:col-span-7 xl:col-span-8">
                            <DashboardCharts
                                evolucaoVendas={evolucaoVendas}
                                vendasPorCategoria={vendasPorCategoria}
                                carregando={atualizandoFiltro}
                            />
                        </div>

                        {/* Coluna Direita: Listas de Produtos no Período (4 cols) */}
                        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                            {/* Card: Produtos Mais Vendidos */}
                            <div className="bg-slate-900 p-5 rounded-xl border border-slate-700/80 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                                        <span className="text-amber-400">🔥</span>
                                        <span>Produtos Mais Vendidos</span>
                                    </h3>
                                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                                        Top {maisVendidos.length}
                                    </span>
                                </div>

                                {maisVendidos.length === 0 ? (
                                    <p className="text-slate-500 text-xs text-center py-6">
                                        Nenhuma venda registrada no período selecionado.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {maisVendidos.map((prod, index) => (
                                            <div
                                                key={prod.id}
                                                className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-lg border border-slate-800 hover:border-slate-700 transition"
                                            >
                                                <div className="flex items-center space-x-3 truncate">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                                        index === 0 ? 'bg-amber-500 text-slate-950' :
                                                        index === 1 ? 'bg-slate-300 text-slate-950' :
                                                        index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <div className="truncate">
                                                        <p className="text-sm font-bold text-white truncate">{prod.produto_nome}</p>
                                                        <p className="text-[11px] text-slate-400">
                                                            {prod.total_vendido} {prod.total_vendido === 1 ? 'unidade' : 'unidades'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-400 font-mono shrink-0 ml-2">
                                                    R$ {Number(prod.total_faturado).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Card: Últimos Produtos Vendidos */}
                            <div className="bg-slate-900 p-5 rounded-xl border border-slate-700/80 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                                        <span className="text-cyan-400">⚡</span>
                                        <span>Últimos Produtos Vendidos</span>
                                    </h3>
                                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                                        Recentes
                                    </span>
                                </div>

                                {ultimosVendidos.length === 0 ? (
                                    <p className="text-slate-500 text-xs text-center py-6">
                                        Nenhuma saída de item registrada no período.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {ultimosVendidos.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
                                            >
                                                <div className="truncate mr-2">
                                                    <p className="text-sm font-semibold text-white truncate">{item.produto_nome}</p>
                                                    <p className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                                                        <span>{formatarData(item.data_venda)}</span>
                                                        <span>•</span>
                                                        <span className="text-cyan-400">{item.quantidade} un.</span>
                                                        {item.nome_cliente && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="truncate">{item.nome_cliente}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-400 font-mono shrink-0">
                                                    R$ {Number(item.total).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 4. TABELA DE PRODUTOS COM MENOR ESTOQUE */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                    <span className="text-red-400">⚠️</span>
                                    <span>Produtos com Menor Estoque</span>
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Itens que necessitam de reposição imediata para evitar ruptura
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setAbaAtiva('inventario');
                                    setMostrarFormulario(true);
                                }}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg border border-slate-700 font-bold transition cursor-pointer"
                            >
                                + Adicionar Produto
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-700/80">
                            <table className="w-full text-left text-slate-300 text-sm">
                                <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">Produto</th>
                                        <th className="px-4 py-3">Categoria</th>
                                        <th className="px-4 py-3 text-right">Preço Unit.</th>
                                        <th className="px-4 py-3 text-center">Estoque Atual</th>
                                        <th className="px-4 py-3 text-center">Nível de Alerta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {menorEstoque.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                Nenhum produto cadastrado na base.
                                            </td>
                                        </tr>
                                    ) : (
                                        menorEstoque.map(prod => {
                                            const estoque = Number(prod.estoque || 0);
                                            const isCritico = estoque <= 5;
                                            const isAtencao = estoque > 5 && estoque <= 15;

                                            return (
                                                <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-400">#{prod.id}</td>
                                                    <td className="px-4 py-3 font-bold text-white">{prod.nome}</td>
                                                    <td className="px-4 py-3 text-slate-400 text-xs">
                                                        {prod.categoria_nome || 'Sem categoria'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono">
                                                        R$ {Number(prod.preco).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold font-mono">
                                                        {estoque} un.
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {isCritico ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                                                Crítico (≤ 5)
                                                            </span>
                                                        ) : isAtencao ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                                Atenção (≤ 15)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                                Normal
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* ABA 2: GESTÃO DE INVENTÁRIO (PRODUTOS CRUD ORIGINAL)      */}
            {/* ========================================================= */}
            {abaAtiva === 'inventario' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">Inventário de Produtos</h3>
                            <p className="text-slate-400 text-xs">Cadastre, edite e gerencie o estoque dos produtos</p>
                        </div>

                        <button
                            onClick={() => {
                                setProdutoEmEdicao(null);
                                setMostrarFormulario(!mostrarFormulario);
                            }}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold transition text-sm cursor-pointer shadow-lg"
                        >
                            {mostrarFormulario ? 'Fechar Formulário' : '+ Novo Produto'}
                        </button>
                    </div>

                    {/* Formulário Condicional de Produto */}
                    {mostrarFormulario && (
                        <ProdutoForm
                            key={produtoEmEdicao ? produtoEmEdicao.id : 'novo'}
                            categorias={categorias}
                            aoCancelar={() => setMostrarFormulario(false)}
                            aoSalvar={salvarProdutoNaTela}
                            produtoEditando={produtoEmEdicao}
                        />
                    )}

                    {/* Tabela de Produtos */}
                    <div className="overflow-x-auto rounded-lg border border-slate-700">
                        <table className="w-full text-left text-slate-300">
                            <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Nome do Produto</th>
                                    <th className="px-6 py-4">Preço (R$)</th>
                                    <th className="px-6 py-4">Estoque</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700 text-sm">
                                {produtos.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            Nenhum produto cadastrado na base de dados.
                                        </td>
                                    </tr>
                                ) : (
                                    produtos.map((produto) => (
                                        <tr key={produto.id} className="hover:bg-slate-700/50 transition">
                                            <td className="px-6 py-4 font-mono text-cyan-400">#{produto.id}</td>
                                            <td className="px-6 py-4 font-bold text-white">{produto.nome}</td>
                                            <td className="px-6 py-4 font-mono">
                                                R$ {Number(produto.preco).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    produto.estoque <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                    {produto.estoque} un.
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center space-x-3">
                                                <button
                                                    onClick={() => iniciarEdicao(produto)}
                                                    className="text-cyan-400 hover:text-cyan-300 font-bold text-xs transition cursor-pointer"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => deletarProduto(produto.id, produto.nome)}
                                                    className="text-red-400 hover:text-red-300 font-bold text-xs transition cursor-pointer"
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}