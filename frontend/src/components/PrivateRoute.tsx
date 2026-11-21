import { Navigate } from 'react-router-dom';

// Tipagem dizendo que este componente precisa "abraçar" outros componentes (children)
interface PrivateRouteProps {
    children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
    // 1. O Segurança olha para o cofre do navegador
    const token = localStorage.getItem('ms2pdv_token');

    // 2. Se NÃO tiver token, o usuário é ejetado sumariamente para a rota de Login ("/")
    if (!token) {
        return <Navigate to="/" replace />; 
        // O "replace" apaga a tentativa do histórico para o usuário não conseguir burlar clicando em "Voltar"
    }

    // 3. Se tiver token, o componente "abraçado" (ex: Dashboard) é renderizado normalmente
    return <>{children}</>;
}