'use client';

// Header - Padaria Paula
// Cabeçalho com nome da loja, indicador de área e botões de ação

import { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';

interface Configuracao {
  id: string;
  nomeLoja: string;
}

export default function Header() {
  const [config, setConfig] = useState<Configuracao | null>(null);
  const { autenticado, logout } = useAuthStore();
  const { autenticado: adminAutenticado, logout: logoutAdmin } = useAdminStore();
  const { telaAtual, setTela } = useAppStore();

  // Verificar se está na área admin
  const naAreaAdmin = telaAtual === 'admin' && adminAutenticado;

  useEffect(() => {
    fetch('/api/configuracao')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Erro ao carregar configurações:', err));
  }, []);

  // Logout completo do sistema
  const handleLogout = () => {
    logout();
    logoutAdmin();
    // Recarrega a página para resetar o estado
    window.location.reload();
  };

  // Voltar da área admin para área normal
  const handleVoltar = () => {
    logoutAdmin(); // Só sai da área admin, mantém logado como funcionário
    setTela('novo-pedido');
  };

  return (
    <header className={`shadow-md transition-colors ${
      naAreaAdmin 
        ? 'bg-amber-700 text-white' 
        : 'bg-primary text-primary-foreground'
    }`}>
      <div className="container mx-auto px-3 py-3 sm:py-4 flex items-center justify-between">
        {/* Área de Ação Esquerda */}
        <div className="w-24 flex justify-start">
          {naAreaAdmin ? (
            // Na área admin: botão "Voltar"
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-white/90 hover:text-white hover:bg-white/10"
              onClick={handleVoltar}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          ) : autenticado ? (
            // Na área normal: indicador de funcionário
            <div className="flex items-center gap-1.5 text-white/70">
              <User className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Funcionário</span>
            </div>
          ) : (
            <div className="w-10"></div>
          )}
        </div>

        {/* Título Central */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 
              className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {config?.nomeLoja || 'Padaria e Confeitaria Paula'}
            </h1>
          </div>
          {naAreaAdmin && (
            <Badge variant="secondary" className="mt-1 bg-amber-600 text-white border-amber-500 gap-1">
              <Shield className="w-3 h-3" />
              Área Administrativa
            </Badge>
          )}
        </div>
        
        {/* Área de Ação Direita */}
        <div className="w-24 flex justify-end">
          {autenticado && !naAreaAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-white/90 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
