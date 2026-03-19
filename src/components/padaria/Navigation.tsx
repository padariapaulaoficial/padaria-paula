'use client';

// Navigation - Padaria Paula
// Barra de navegação principal - Responsiva para mobile

import { useAppStore, Tela } from '@/store/useAppStore';
import { usePedidoStore } from '@/store/usePedidoStore';
import { 
  ShoppingBag, 
  History, 
  Settings,
  Users,
  Truck,
  FileText,
  Home
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  id: Tela;
  label: string;
  icon: React.ReactNode;
  shortLabel?: string;
  requiresClient?: boolean;
}

export default function Navigation() {
  const { telaAtual, setTela } = useAppStore();
  const { itens, cliente } = usePedidoStore();

  // Itens de navegação
  const navItems: NavItem[] = [
    { id: 'novo-pedido', label: 'PDV', shortLabel: 'PDV', icon: <Home className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'clientes', label: 'Clientes', shortLabel: 'Clientes', icon: <Users className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'orcamentos', label: 'Orçamentos', shortLabel: 'Orçamentos', icon: <FileText className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'historico', label: 'Histórico', shortLabel: 'Histórico', icon: <History className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'entregas', label: 'Entregas', shortLabel: 'Entregas', icon: <Truck className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'admin', label: 'Administrativo', shortLabel: 'Admin', icon: <Settings className="w-6 h-6 sm:w-5 sm:h-5" /> },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      {/* Mobile: Menu grande com ícones */}
      <div className="lg:hidden">
        <div className="flex overflow-x-auto gap-0.5 p-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = telaAtual === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setTela(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 relative shrink-0 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95'
                }`}
              >
                <div className="relative">
                  {item.icon}
                </div>
                <span className="text-xs mt-1 font-medium whitespace-nowrap">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop/Tablet: Menu horizontal tradicional */}
      <div className="hidden lg:block container mx-auto px-4">
        <div className="flex items-center justify-center h-12">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = telaAtual === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setTela(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
