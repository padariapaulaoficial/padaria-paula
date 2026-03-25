'use client';

// CupomVisual - Padaria Paula
// Visualização de cupom estilo papel térmico realista

interface CupomVisualProps {
  conteudo: string;
  titulo?: string;
  fonteGrande?: boolean;
}

export default function CupomVisual({ conteudo, titulo, fonteGrande = false }: CupomVisualProps) {
  // Função para criar borda serrilhada (simulando papel térmico cortado)
  const serrilhadoSVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='6' viewBox='0 0 12 6'%3E%3Cpath d='M0,6 L6,0 L12,6' fill='white' stroke='%23d1d5db' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div className="flex justify-center py-4 px-2">
      <div 
        className="relative"
        style={{ 
          width: 280,
          minWidth: 280,
        }}
      >
        {/* Papel térmico realista */}
        <div 
          className="relative"
          style={{
            backgroundColor: '#fafafa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          }}
        >
          {/* Faixa superior serrilhada */}
          <div 
            style={{
              height: 8,
              backgroundImage: serrilhadoSVG,
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'bottom',
              backgroundColor: '#f0f0f0',
            }}
          />

          {/* Título do cupom */}
          {titulo && (
            <div 
              className="text-center py-2"
              style={{
                borderBottom: '1px dashed #9ca3af',
                backgroundColor: '#f9f9f9',
              }}
            >
              <span 
                style={{
                  fontSize: 10,
                  color: '#6b7280',
                  fontWeight: 500,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {titulo}
              </span>
            </div>
          )}
          
          {/* Conteúdo do cupom */}
          <div 
            className="relative"
            style={{
              padding: '12px 14px',
              backgroundColor: '#fefefe',
            }}
          >
            <pre 
              style={{
                fontFamily: "'Courier New', 'Lucida Console', 'Consolas', monospace",
                fontSize: fonteGrande ? 13 : 11,
                lineHeight: fonteGrande ? 1.6 : 1.4,
                fontWeight: fonteGrande ? 600 : 400,
                color: '#1a1a1a',
                letterSpacing: '0.03em',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
              }}
            >
              {conteudo}
            </pre>
          </div>
          
          {/* Linha de corte final */}
          <div 
            style={{
              padding: '8px 14px 0',
              backgroundColor: '#fefefe',
            }}
          >
            <div 
              style={{
                borderTop: '2px dashed #9ca3af',
              }}
            />
          </div>

          {/* Faixa inferior serrilhada */}
          <div 
            style={{
              height: 10,
              backgroundImage: serrilhadoSVG,
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'top',
              backgroundColor: '#f0f0f0',
              transform: 'rotate(180deg)',
            }}
          />
        </div>
        
        {/* Sombra realista do papel */}
        <div 
          style={{
            position: 'absolute',
            left: 4,
            right: 4,
            bottom: -6,
            height: 12,
            backgroundColor: 'rgba(0,0,0,0.06)',
            filter: 'blur(4px)',
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}
