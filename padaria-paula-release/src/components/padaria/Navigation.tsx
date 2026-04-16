'use client';

// Navigation - Padaria Paula
// Barra de navegação principal - Responsiva para mobile

import { useAppStore, Tela } from '@/store/useAppStore';
import { usePedidoStore } from '@/store/usePedidoStore';
import { 
  Home, 
  ShoppingBag, 
  History, 
  Settings,
  Users,
  Truck,
  FileText
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

  // Itens de navegação - Produtos só aparece se tiver cliente
  const navItems: NavItem[] = [
    { id: 'novo-pedido', label: 'Novo Pedido', shortLabel: 'Novo', icon: <Home className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'clientes', label: 'Clientes', shortLabel: 'Clientes', icon: <Users className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'produtos', label: 'Produtos', shortLabel: 'Produtos', icon: <ShoppingBag className="w-6 h-6 sm:w-5 sm:h-5" />, requiresClient: true },
    { id: 'orcamentos', label: 'Orçamentos', shortLabel: 'Orçamentos', icon: <FileText className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'entregas', label: 'Entregas', shortLabel: 'Entregas', icon: <Truck className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'historico', label: 'Histórico', shortLabel: 'Histórico', icon: <History className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'admin', label: 'Administrativo', shortLabel: 'Admin', icon: <Settings className="w-6 h-6 sm:w-5 sm:h-5" /> },
  ];

  // Filtrar itens que requerem cliente
  const visibleNavItems = navItems.filter(item => {
    if (item.requiresClient && !cliente) return false;
    return true;
  });

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      {/* Mobile: Menu grande com ícones */}
      <div className="lg:hidden">
        {/* Grid de navegação */}
        <div className="flex overflow-x-auto gap-0.5 p-1 scrollbar-hide">
          {visibleNavItems.map((item) => {
            const isActive = telaAtual === item.id;
            const isProdutosComItens = item.id === 'produtos' && itens.length > 0;
            
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
                  {isProdutosComItens && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold bg-accent text-accent-foreground"
                    >
                      {itens.length}
                    </Badge>
                  )}
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
          {/* Navegação Principal */}
          <div className="flex items-center gap-1">
            {visibleNavItems.map((item) => {
              const isActive = telaAtual === item.id;
              const isProdutosComItens = item.id === 'produtos' && itens.length > 0;
              
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
                  {isProdutosComItens && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {itens.length}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
