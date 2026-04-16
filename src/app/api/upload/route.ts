import { NextRequest, NextResponse } from 'next/server';

// POST - Upload de imagem (retorna base64 para persistir no banco)
// Na Vercel (serverless), arquivos locais são perdidos após cada deploy
// Por isso, retornamos base64 para salvar diretamente no banco de dados
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tipo = formData.get('tipo') as string || 'produto';

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Apenas imagens são permitidas' },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 2MB para base64 - evita payloads muito grandes)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 2MB' },
        { status: 400 }
      );
    }

    // Converter arquivo para base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Criar data URL (compatível com img src)
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log(`Upload realizado: ${tipo} (${(file.size / 1024).toFixed(1)}KB)`);

    return NextResponse.json({
      success: true,
      url: dataUrl,           // Data URL para usar diretamente em img src
      base64: dataUrl,        // Alias para clareza
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro ao processar upload do arquivo' },
      { status: 500 }
    );
  }
}
