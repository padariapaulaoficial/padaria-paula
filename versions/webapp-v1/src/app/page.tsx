'use client';

// Página Principal - Padaria Paula
// Single Page Application com navegação por estado

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { usePedidoStore } from '@/store/usePedidoStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
import Header from '@/components/padaria/Header';
import NovoPedido from '@/components/padaria/NovoPedido';
import ProdutosLista from '@/components/padaria/ProdutosLista';
import Carrinho from '@/components/padaria/Carrinho';
import ResumoPedido from '@/components/padaria/ResumoPedido';
import ImpressaoManager from '@/components/padaria/ImpressaoManager';
import HistoricoPedidos from '@/components/padaria/HistoricoPedidos';
import AdminPanel from '@/components/padaria/AdminPanel';
import ClientesLista from '@/components/padaria/ClientesLista';
import EntregasLista from '@/components/padaria/EntregasLista';
import Navigation from '@/components/padaria/Navigation';
import LoginScreen from '@/components/padaria/LoginScreen';
import AdminLoginScreen from '@/components/padaria/AdminLoginScreen';
import OrcamentosLista from '@/components/padaria/OrcamentosLista';
import NovoOrcamento from '@/components/padaria/NovoOrcamento';
import { Loader2 } from 'lucide-react';

// Componente de Footer
function Footer() {
  return (
    <footer className="bg-primary/95 text-primary-foreground py-2 text-center text-xs mt-auto">
      <p>© {new Date().getFullYear()} Padaria e Confeitaria Paula</p>
    </footer>
  );
}

export default function Page() {
  const { telaAtual, setTela } = useAppStore();
  const { cliente, itens } = usePedidoStore();
  const { autenticado, verificarAuth } = useAuthStore();
  const { autenticado: adminAutenticado, verificarAuth: verificarAdminAuth } = useAdminStore();
  const [checking, setChecking] = useState(true);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      await verificarAuth();
      await verificarAdminAuth();
      setChecking(false);
    };
    checkAuth();
  }, [verificarAuth, verificarAdminAuth]);

  // Enquanto verifica autenticação
  if (checking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Carregando...</p>
      </div>
    );
  }

  // Se não autenticado, mostrar tela de login
  if (!autenticado) {
    return <LoginScreen />;
  }

  // Se está na tela de admin mas não autenticado como admin, pedir PIN
  if (telaAtual === 'admin' && !adminAutenticado) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <Navigation />
        <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-4 max-w-7xl">
          <AdminLoginScreen onLoginSuccess={() => {}} />
        </main>
      </div>
    );
  }

  // Renderizar conteúdo baseado na tela atual
  const renderConteudo = () => {
    switch (telaAtual) {
      case 'novo-pedido':
        return <NovoPedido />;

      case 'clientes':
        return <ClientesLista />;

      case 'produtos':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-full">
            <div className={`lg:col-span-2 ${itens.length > 0 ? 'pb-20 lg:pb-0' : ''}`}>
              <ProdutosLista />
            </div>
            <div className="lg:col-span-1 hidden lg:block">
              <Carrinho />
            </div>
          </div>
        );

      case 'resumo':
        return <ResumoPedido />;

      case 'impressao':
        return <ImpressaoManager />;

      case 'entregas':
        return <EntregasLista />;

      case 'historico':
        return <HistoricoPedidos />;

      case 'orcamentos':
        return <OrcamentosLista />;

      case 'novo-orcamento':
        return <NovoOrcamento />;

      case 'admin':
        return <AdminPanel />;

      default:
        return <NovoPedido />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header />

      {/* Navegação Principal */}
      <Navigation />

      {/* Conteúdo Principal */}
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-4 max-w-7xl">
        {renderConteudo()}
      </main>

      {/* Footer discreto */}
      {telaAtual !== 'produtos' && <Footer />}

      {/* Carrinho fixo no mobile quando na tela de produtos */}
      {telaAtual === 'produtos' && itens.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-40 safe-area-bottom">
          <Carrinho isMobile />
        </div>
      )}
    </div>
  );
}
