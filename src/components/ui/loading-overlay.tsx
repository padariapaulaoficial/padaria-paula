'use client';

// LoadingOverlay - Animação discreta para operações com delay
// Pode ser usado globalmente ou localmente

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Atualizando...' }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-fade-in">
      <div className="flex flex-col items-center gap-3 bg-background/95 px-6 py-4 rounded-xl shadow-lg border border-border/50 animate-scale-in">
        <div className="relative">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <span className="text-sm font-medium text-foreground animate-pulse">{message}</span>
      </div>
    </div>
  );
}

// Versão inline para usar dentro de cards/dialogs
export function LoadingInline({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Versão compacta para botões
export function LoadingSpinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-4 h-4 animate-spin ${className}`} />;
}
