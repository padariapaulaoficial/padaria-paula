import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST - Upload de imagem
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

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${tipo}-${timestamp}-${randomStr}.${extension}`;

    // Criar diretório se não existir
    const uploadDir = path.join(process.cwd(), 'public', 'produtos');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Diretório já existe
    }

    // Converter arquivo para buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Retornar URL pública
    const url = `/produtos/${fileName}`;

    console.log(`Upload realizado: ${url}`);

    return NextResponse.json({
      success: true,
      url,
      fileName,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}
