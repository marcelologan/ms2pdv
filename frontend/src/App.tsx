// 1. Importamos as ferramentas de roteamento da biblioteca
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

// 2. Importamos os nossos layouts fixos
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// 3. Importamos as nossas Páginas cheias
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { Dashboard } from './pages/Dashboard';
import { Perfil } from './pages/Perfil';
import { Categorias } from './pages/Categorias';
import { Vendas } from './pages/Vendas';
import { PrivateRoute } from './components/PrivateRoute';

function App() {
  return (
    // O BrowserRouter liga o monitoramento da URL do navegador
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 flex flex-col">

        {/* O Header fica fixo no topo, independente da página que mudar abaixo */}
        <Header />

        {/* Área dinâmica que vai trocar de conteúdo baseada na rota */}
        <main className="flex-grow w-full max-w-6xl mx-auto p-8 flex items-center justify-center">

          {/* O container Routes decide qual Route bate com a URL atual */}
          <Routes>
            {/* Se a URL for exatamente "/", renderiza a tela de Login */}
            <Route path="/" element={<Login />} />

            {/* Se a URL for "/cadastro", renderiza a tela de Cadastro de Usuário */}
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Se a URL for "/dashboard", renderiza o Painel de Controle */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />

            {/* Se a URL for "/perfil", renderiza a página de Perfil */}
            <Route path="/perfil" element={
              <PrivateRoute>
                <Perfil />
              </PrivateRoute>
            } />

            {/* Se a URL for "/categorias", renderiza a página de Categorias */}
            <Route path="/categorias" element={
              <PrivateRoute>
                <Categorias />
              </PrivateRoute>
            } />

            {/* Se a URL for "/vendas", renderiza o Módulo de Vendas */}
            <Route path="/vendas" element={
              <PrivateRoute>
                <Vendas />
              </PrivateRoute>
            } />
            {/* Rota coringa caso acesse qualquer rota desconhecida */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

        </main>

        {/* O Footer fica fixo na base do sistema */}
        <Footer />
      </div>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;