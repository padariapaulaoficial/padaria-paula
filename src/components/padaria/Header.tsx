'use client';

// Header - Padaria Paula
// Cabeçalho compacto com nome da loja e botão de logout

import { useEffect, useState } from 'react';
import { LogOut, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Configuracao {
  id: string;
  nomeLoja: string;
}

export default function Header() {
  const [config, setConfig] = useState<Configuracao | null>(null);
  const { autenticado, logout } = useAuthStore();
  const { logout: logoutAdmin } = useAdminStore();

  useEffect(() => {
    fetch('/api/configuracao')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Erro ao carregar configurações:', err));
  }, []);

  const handleLogout = () => {
    logout();
    logoutAdmin();
    // Recarrega a página para resetar o estado
    window.location.reload();
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-md shrink-0">
      <div className="container mx-auto px-2 sm:px-3 py-2 sm:py-3 md:py-4 flex items-center justify-between">
        <div className="w-8 sm:w-10"></div> {/* Espaçador */}
        <h1 
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-center flex-1 line-clamp-1"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {config?.nomeLoja || 'Padaria e Confeitaria Paula'}
        </h1>
        
        {/* Botão de logout discreto */}
        <div className="w-8 sm:w-10 flex justify-end">
          {autenticado && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Sair</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </header>
  );
}
