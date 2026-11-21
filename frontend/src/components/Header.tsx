import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export function Header() {
    const navegar = useNavigate();
    const localizacao = useLocation();
    const [menuAberto, setMenuAberto] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Opcional: Pegamos o nome do usuário para dar boas-vindas
    const nomeUsuario = localStorage.getItem('ms2pdv_usuario');
    const estaLogado = !!localStorage.getItem('ms2pdv_token');

    // Fechar o menu ao clicar fora
    useEffect(() => {
        const lidarCliqueFora = (evento: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(evento.target as Node)) {
                setMenuAberto(false);
            }
        };
        document.addEventListener('mousedown', lidarCliqueFora);
        return () => document.removeEventListener('mousedown', lidarCliqueFora);
    }, []);

    const efetuarLogout = async () => {
        const token = localStorage.getItem('ms2pdv_token');
        try {
            await fetch('http://localhost:3000/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (erro) {
            console.error("Erro ao efetuar logout:", erro);
        }
        // 1. Queima o crachá
        localStorage.removeItem('ms2pdv_token');
        localStorage.removeItem('ms2pdv_usuario');
        setMenuAberto(false);
        // 2. Chuta de volta para o login
        navegar('/');
    };

    const rotaAtiva = (caminho: string) => localizacao.pathname === caminho;

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-6 shadow-md relative z-50">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <Link to={estaLogado ? "/dashboard" : "/"} className="text-2xl font-bold text-cyan-400 hover:text-cyan-300 transition flex-shrink-0">
                    MS² PDV <span className="text-slate-400 text-sm font-normal hidden md:inline">| Sistema de Ponto de Venda</span>
                </Link>
                
                {/* Navegação Superior - Desktop */}
                {estaLogado && (
                    <nav className="hidden md:flex items-center space-x-2">
                        <Link 
                            to="/dashboard" 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                rotaAtiva('/dashboard') 
                                ? 'bg-slate-900 text-cyan-400 border border-slate-700 shadow-inner' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                        >
                            Painel de Controle
                        </Link>
                        <Link 
                            to="/categorias" 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                rotaAtiva('/categorias') 
                                ? 'bg-slate-900 text-cyan-400 border border-slate-700 shadow-inner' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                        >
                            Categorias
                        </Link>
                        <Link 
                            to="/vendas" 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                rotaAtiva('/vendas') 
                                ? 'bg-slate-900 text-cyan-400 border border-slate-700 shadow-inner' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                        >
                            Vendas
                        </Link>
                    </nav>
                )}

                {/* O Menu só aparece se o usuário estiver logado */}
                {estaLogado && (
                    <div className="flex items-center space-x-4">
                        <span className="text-slate-400 text-sm hidden sm:inline">
                            Olá, <strong className="text-white">{nomeUsuario}</strong>
                        </span>

                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setMenuAberto(!menuAberto)}
                                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 flex items-center justify-center transition focus:outline-none cursor-pointer"
                                title="Menu de Usuário"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>

                            {menuAberto && (
                                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-2 z-50 animate-fade-in">
                                    {/* Links Mobile */}
                                    <div className="md:hidden border-b border-slate-800 pb-1 mb-1">
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setMenuAberto(false)}
                                            className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                        >
                                            <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                            </svg>
                                            Painel
                                        </Link>
                                        <Link
                                            to="/categorias"
                                            onClick={() => setMenuAberto(false)}
                                            className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                        >
                                            <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            Categorias
                                        </Link>
                                        <Link
                                            to="/vendas"
                                            onClick={() => setMenuAberto(false)}
                                            className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                        >
                                            <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            Vendas
                                        </Link>
                                    </div>

                                    <Link
                                        to="/perfil"
                                        onClick={() => setMenuAberto(false)}
                                        className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                    >
                                        <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Meu Perfil
                                    </Link>
                                    <button
                                        onClick={efetuarLogout}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 border-t border-slate-800 transition mt-1 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sair do Sistema
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}