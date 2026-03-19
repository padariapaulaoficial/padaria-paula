'use client';

// CupomTermico - Padaria Paula
// Visualização de cupom simulando papel térmico real

interface CupomTermicoProps {
  children: string;
  className?: string;
  largura?: number; // largura em pixels (padrão 300px para 80mm)
  fonteMaior?: boolean;
}

export default function CupomTermico({ 
  children, 
  className = '', 
  largura = 300,
  fonteMaior = false 
}: CupomTermicoProps) {
  return (
    <div className="flex justify-center py-4">
      <div 
        className="relative"
        style={{ width: largura }}
      >
        {/* Sombra do papel */}
        <div 
          className="absolute inset-0 bg-gray-400/30 rounded-sm blur-sm translate-x-1 translate-y-1"
          aria-hidden="true"
        />
        
        {/* Papel térmico */}
        <div 
          className={`
            relative bg-gradient-to-b from-gray-50 via-white to-gray-50
            shadow-lg
            ${className}
          `}
          style={{
            // Bordas serrilhadas simulando corte de papel
            clipPath: 'polygon(' +
              '0% 0%, ' +
              '3% 0.5%, 6% 0%, 9% 0.5%, 12% 0%, 15% 0.5%, 18% 0%, 21% 0.5%, 24% 0%, 27% 0.5%, 30% 0%, ' +
              '33% 0.5%, 36% 0%, 39% 0.5%, 42% 0%, 45% 0.5%, 48% 0%, 51% 0.5%, 54% 0%, 57% 0.5%, 60% 0%, ' +
              '63% 0.5%, 66% 0%, 69% 0.5%, 72% 0%, 75% 0.5%, 78% 0%, 81% 0.5%, 84% 0%, 87% 0.5%, 90% 0%, ' +
              '93% 0.5%, 96% 0%, 100% 0%, ' +
              '100% 100%, ' +
              '96% 99.5%, 93% 100%, 90% 99.5%, 87% 100%, 84% 99.5%, 81% 100%, 78% 99.5%, 75% 100%, 72% 99.5%, 69% 100%, ' +
              '66% 99.5%, 63% 100%, 60% 99.5%, 57% 100%, 54% 99.5%, 51% 100%, 48% 99.5%, 45% 100%, 42% 99.5%, 39% 100%, ' +
              '36% 99.5%, 33% 100%, 30% 99.5%, 27% 100%, 24% 99.5%, 21% 100%, 18% 99.5%, 15% 100%, 12% 99.5%, 9% 100%, ' +
              '6% 99.5%, 3% 100%, 0% 100%' +
            ')',
          }}
        >
          {/* Textura de papel */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden="true"
          />
          
          {/* Conteúdo do cupom */}
          <div className="relative p-4">
            <pre 
              className={`
                font-mono whitespace-pre-wrap
                ${fonteMaior ? 'text-[13px] leading-relaxed font-semibold' : 'text-[11px] leading-tight'}
              `}
              style={{
                fontFamily: "'Courier New', 'Lucida Console', monospace",
                color: '#1a1a1a',
                letterSpacing: '0.02em',
                // Efeito de impressão térmica (levemente pontilhado)
                WebkitFontSmoothing: 'none',
                MozOsxFontSmoothing: 'grayscale',
              }}
            >
              {children}
            </pre>
          </div>
          
          {/* Linha de corte no final */}
          <div className="flex justify-center pb-2">
            <div 
              className="w-3/4 border-t-2 border-dashed"
              style={{ 
                borderColor: '#ccc',
                borderStyle: 'dashed',
                borderWidth: '1px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
