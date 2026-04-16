from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Create document
pdf_path = "/home/z/my-project/download/Guia_Deploy_Vercel_PadariaPaula.pdf"
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title="Guia Deploy Vercel - Padaria Paula",
    author='Z.ai',
    creator='Z.ai',
    subject='Guia completo para deploy do sistema Padaria Paula na Vercel'
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'TitleStyle',
    parent=styles['Title'],
    fontName='Microsoft YaHei',
    fontSize=28,
    leading=34,
    alignment=TA_CENTER,
    spaceAfter=20,
    textColor=colors.HexColor('#1F4E79')
)

subtitle_style = ParagraphStyle(
    'SubtitleStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=14,
    leading=20,
    alignment=TA_CENTER,
    spaceAfter=30,
    textColor=colors.HexColor('#666666')
)

h1_style = ParagraphStyle(
    'H1Style',
    parent=styles['Heading1'],
    fontName='Microsoft YaHei',
    fontSize=18,
    leading=24,
    spaceBefore=20,
    spaceAfter=12,
    textColor=colors.HexColor('#1F4E79')
)

h2_style = ParagraphStyle(
    'H2Style',
    parent=styles['Heading2'],
    fontName='Microsoft YaHei',
    fontSize=14,
    leading=20,
    spaceBefore=15,
    spaceAfter=8,
    textColor=colors.HexColor('#2E75B6')
)

body_style = ParagraphStyle(
    'BodyStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=11,
    leading=18,
    alignment=TA_JUSTIFY,
    spaceAfter=8,
    wordWrap='CJK'
)

code_style = ParagraphStyle(
    'CodeStyle',
    parent=styles['Normal'],
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    backColor=colors.HexColor('#F5F5F5'),
    leftIndent=10,
    rightIndent=10,
    spaceBefore=5,
    spaceAfter=5,
    borderColor=colors.HexColor('#E0E0E0'),
    borderWidth=1,
    borderPadding=8
)

bullet_style = ParagraphStyle(
    'BulletStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=11,
    leading=16,
    leftIndent=20,
    spaceAfter=4,
    wordWrap='CJK'
)

warning_style = ParagraphStyle(
    'WarningStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=11,
    leading=16,
    backColor=colors.HexColor('#FFF3CD'),
    leftIndent=10,
    rightIndent=10,
    spaceBefore=10,
    spaceAfter=10,
    borderColor=colors.HexColor('#FFC107'),
    borderWidth=1,
    borderPadding=10,
    wordWrap='CJK'
)

tip_style = ParagraphStyle(
    'TipStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=11,
    leading=16,
    backColor=colors.HexColor('#D4EDDA'),
    leftIndent=10,
    rightIndent=10,
    spaceBefore=10,
    spaceAfter=10,
    borderColor=colors.HexColor('#28A745'),
    borderWidth=1,
    borderPadding=10,
    wordWrap='CJK'
)

story = []

# Cover Page
story.append(Spacer(1, 3*cm))
story.append(Paragraph("<b>Guia de Deploy na Vercel</b>", title_style))
story.append(Paragraph("Sistema Padaria Paula", subtitle_style))
story.append(Spacer(1, 1*cm))
story.append(Paragraph("Guia completo para colocar seu sistema em produção", body_style))
story.append(Spacer(1, 2*cm))

# Info box
info_data = [[Paragraph("<b>Tecnologias do Projeto</b>", ParagraphStyle('InfoHeader', fontName='Microsoft YaHei', fontSize=12, textColor=colors.white, alignment=TA_CENTER))],
             [Paragraph("Next.js 16 + React 19 + TypeScript", ParagraphStyle('InfoBody', fontName='SimHei', fontSize=10, alignment=TA_CENTER))],
             [Paragraph("Prisma ORM + PostgreSQL", ParagraphStyle('InfoBody', fontName='SimHei', fontSize=10, alignment=TA_CENTER))],
             [Paragraph("Zustand + shadcn/ui + Tailwind CSS", ParagraphStyle('InfoBody', fontName='SimHei', fontSize=10, alignment=TA_CENTER))]]

info_table = Table(info_data, colWidths=[12*cm])
info_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#1F4E79')),
]))
story.append(info_table)

story.append(PageBreak())

# Table of Contents
story.append(Paragraph("<b>Sumário</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

toc_items = [
    "1. Visão Geral e Pré-requisitos",
    "2. Preparar o Banco de Dados PostgreSQL",
    "3. Configurar o Projeto para Produção",
    "4. Deploy na Vercel - Passo a Passo",
    "5. Configurar Variáveis de Ambiente",
    "6. Executar Migrações do Banco",
    "7. Testar o Sistema em Produção",
    "8. Manutenção e Atualizações",
    "9. Alternativas de Banco de Dados",
    "10. Custos e Limites do Plano Gratuito"
]

for item in toc_items:
    story.append(Paragraph(item, body_style))
    story.append(Spacer(1, 0.2*cm))

story.append(PageBreak())

# Section 1
story.append(Paragraph("<b>1. Visão Geral e Pré-requisitos</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Antes de iniciar o deploy, você precisa ter uma conta na Vercel e um repositório no GitHub com o código do projeto. O processo completo envolve configurar um banco de dados PostgreSQL externo, preparar o código para produção, fazer o deploy na Vercel e configurar todas as variáveis de ambiente necessárias para o funcionamento correto do sistema.", body_style))

story.append(Paragraph("<b>O que você vai precisar:</b>", h2_style))

requirements = [
    "Conta no GitHub (gratuita) - para hospedar o código fonte",
    "Conta na Vercel (gratuita) - para hospedar a aplicação",
    "Conta em um serviço de PostgreSQL (gratuito) - para o banco de dados",
    "Git instalado no computador - para enviar o código ao GitHub",
    "Node.js 18+ instalado - para testar localmente se necessário"
]

for req in requirements:
    story.append(Paragraph(f"• {req}", bullet_style))

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("<b>Por que PostgreSQL e não SQLite?</b>", h2_style))
story.append(Paragraph("O SQLite é um banco de dados baseado em arquivo que funciona bem para desenvolvimento local, mas não é adequado para produção na Vercel por vários motivos importantes. A Vercel usa um sistema de arquivos efêmero, o que significa que os arquivos são perdidos a cada novo deploy ou reinicialização. Além disso, o SQLite não suporta conexões simultâneas de múltiplas instâncias, o que é um problema quando a Vercel escala sua aplicação automaticamente.", body_style))

story.append(Paragraph("<b>IMPORTANTE:</b> Os dados no ambiente de desenvolvimento GLM serão perdidos. Faça backup ou anote os produtos/clientes para cadastrar novamente no sistema em produção.", warning_style))

# Section 2
story.append(Paragraph("<b>2. Preparar o Banco de Dados PostgreSQL</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Existem várias opções gratuitas de PostgreSQL. Vamos mostrar as três melhores opções para o projeto da Padaria Paula, com destaque para o Supabase que é o mais indicado por oferecer a melhor combinação de recursos gratuitos e facilidade de uso.", body_style))

story.append(Paragraph("<b>Opção Recomendada: Supabase (supabase.com)</b>", h2_style))
story.append(Paragraph("O Supabase é uma plataforma completa que oferece PostgreSQL gerenciado com 500MB de armazenamento gratuito, o que é mais do que suficiente para uma padaria pequena ou média. Além disso, oferece autenticação opcional, armazenamento de arquivos e uma interface administrativa muito intuitiva para visualizar e gerenciar os dados.", body_style))

story.append(Paragraph("Passos para criar o banco no Supabase:", body_style))
story.append(Spacer(1, 0.2*cm))

supabase_steps = [
    "Acesse supabase.com e clique em 'Start your project'",
    "Faça login com sua conta GitHub (ou crie uma conta)",
    "Clique em 'New Project' para criar um novo projeto",
    "Escolha um nome como 'padaria-paula-db'",
    "Defina uma senha forte para o banco de dados (guarde esta senha!)",
    "Selecione a região mais próxima (recomendado: São Paulo - sa-east-1)",
    "Aguarde a criação do projeto (leva cerca de 2 minutos)",
    "Vá em Settings → Database e copie a Connection String (URI)"
]

for i, step in enumerate(supabase_steps, 1):
    story.append(Paragraph(f"{i}. {step}", bullet_style))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("<b>A Connection String terá este formato:</b>", body_style))
story.append(Paragraph("postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres", code_style))
story.append(Paragraph("Substitua [YOUR-PASSWORD] pela senha que você definiu no passo 5.", tip_style))

story.append(Paragraph("<b>Outras Opções de Banco de Dados</b>", h2_style))
story.append(Paragraph("Neon (neon.tech): Oferece 3GB gratuitos com auto-scaling. É uma excelente opção para projetos que podem crescer. A interface é moderna e permite criar branches do banco de dados para testes. Vercel Postgres: Integrado diretamente na Vercel, é a opção mais simples pois não requer configuração externa. Oferece 256MB no plano gratuito. Railway: Oferece $5 de crédito mensal gratuito, o que é suficiente para um banco pequeno. A interface é muito intuitiva.", body_style))

# Section 3
story.append(Paragraph("<b>3. Configurar o Projeto para Produção</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Antes de fazer o deploy, o projeto precisa de algumas configurações específicas para funcionar corretamente em produção. Estas mudanças garantem que o banco de dados PostgreSQL seja usado corretamente e que as conexões sejam gerenciadas de forma eficiente.", body_style))

story.append(Paragraph("<b>Passo 1: Atualizar o schema.prisma</b>", h2_style))
story.append(Paragraph("O arquivo prisma/schema.prisma precisa ser modificado para usar PostgreSQL em vez de SQLite. Esta mudança é fundamental pois o SQLite usa sintaxe diferente para alguns tipos de dados e operações.", body_style))
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph("Altere a primeira linha do arquivo de:", body_style))
story.append(Paragraph('datasource db { provider = "sqlite" url = env("DATABASE_URL") }', code_style))
story.append(Paragraph("Para:", body_style))
story.append(Paragraph('datasource db { provider = "postgresql" url = env("DATABASE_URL") }', code_style))

story.append(Paragraph("<b>Passo 2: Criar arquivo .env.example</b>", h2_style))
story.append(Paragraph("Crie um arquivo chamado .env.example na raiz do projeto. Este arquivo serve como modelo para as variáveis de ambiente necessárias. Ele não contém valores reais, apenas os nomes das variáveis que precisam ser configuradas.", body_style))

env_example = """DATABASE_URL="postgresql://user:password@host:5432/database"
NEXT_PUBLIC_APP_NAME="Padaria Paula"
ADMIN_PASSWORD="sua-senha-admin-segura"
PIN_FUNCIONARIOS="1234"
WHATSAPP_MESSAGE="Olá! Seu pedido foi recebido.\""""

story.append(Paragraph(env_example, code_style))

story.append(Paragraph("<b>Passo 3: Verificar o build local</b>", h2_style))
story.append(Paragraph("Antes de fazer deploy, teste se o projeto compila corretamente. Execute o comando abaixo para verificar se não há erros de TypeScript ou outros problemas que impediriam o deploy.", body_style))
story.append(Paragraph("bun run build", code_style))
story.append(Paragraph("Se houver erros, corrija-os antes de continuar. O deploy na Vercel falhará se houver erros de compilação.", warning_style))

# Section 4
story.append(Paragraph("<b>4. Deploy na Vercel - Passo a Passo</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Agora que o banco está configurado e o projeto está preparado, vamos fazer o deploy na Vercel. Este processo conecta seu repositório GitHub à Vercel e configura a build automática.", body_style))

story.append(Paragraph("<b>Passo 1: Enviar código para o GitHub</b>", h2_style))
story.append(Paragraph("Se ainda não enviou o código para o GitHub, siga estes passos no terminal do seu computador:", body_style))

git_commands = [
    "git init (se ainda não inicializou)",
    "git add .",
    'git commit -m "Preparando para deploy na Vercel"',
    "git branch -M main",
    'git remote add origin https://github.com/SEU-USUARIO/padaria-paula.git',
    "git push -u origin main"
]

for cmd in git_commands:
    story.append(Paragraph(f"• {cmd}", bullet_style))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("<b>Passo 2: Conectar na Vercel</b>", h2_style))

vercel_steps = [
    "Acesse vercel.com e clique em 'Sign Up' ou 'Log In'",
    "Escolha 'Continue with GitHub' para conectar sua conta",
    "Autorize a Vercel a acessar seus repositórios",
    "Após login, clique em 'Add New...' → 'Project'",
    "Encontre o repositório 'padaria-paula' na lista",
    "Clique em 'Import' para selecionar o projeto"
]

for i, step in enumerate(vercel_steps, 1):
    story.append(Paragraph(f"{i}. {step}", bullet_style))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("<b>Passo 3: Configurar o projeto</b>", h2_style))

config_steps = [
    "Project Name: padaria-paula (ou nome de sua preferência)",
    "Framework Preset: Next.js (deve ser detectado automaticamente)",
    "Root Directory: ./ (padrão)",
    "Build Command: bun run build (ou deixe padrão)",
    "Output Directory: .next (padrão)",
    "Install Command: bun install (ou deixe padrão)"
]

for step in config_steps:
    story.append(Paragraph(f"• {step}", bullet_style))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("NÃO clique em Deploy ainda! Primeiro precisamos configurar as variáveis de ambiente.", warning_style))

# Section 5
story.append(Paragraph("<b>5. Configurar Variáveis de Ambiente</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("As variáveis de ambiente são essenciais para o funcionamento do sistema. Elas contém informações sensíveis como a conexão com o banco de dados e senhas que não devem ficar no código fonte.", body_style))

story.append(Paragraph("<b>Na tela de configuração do projeto na Vercel:</b>", h2_style))
story.append(Spacer(1, 0.2*cm))

env_vars = [
    ("DATABASE_URL", "String de conexão do PostgreSQL obtida no Supabase"),
    ("ADMIN_PASSWORD", "Senha para acessar o painel administrativo"),
    ("PIN_FUNCIONARIOS", "PIN de 4 dígitos para funcionários"),
    ("WHATSAPP_MESSAGE", "Mensagem padrão enviada pelo WhatsApp"),
    ("NEXT_PUBLIC_APP_NAME", "Nome do app (pode ser deixado vazio)")
]

story.append(Paragraph("Clique em 'Environment Variables' e adicione cada variável:", body_style))
story.append(Spacer(1, 0.2*cm))

# Table for env vars
header_style = ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=11, textColor=colors.white, alignment=TA_CENTER)
cell_style = ParagraphStyle('TableCell', fontName='SimHei', fontSize=10, alignment=TA_LEFT)

env_table_data = [[Paragraph("<b>Variável</b>", header_style), Paragraph("<b>Valor de Exemplo</b>", header_style)]]
for var, desc in env_vars:
    env_table_data.append([Paragraph(var, cell_style), Paragraph(desc, cell_style)])

env_table = Table(env_table_data, colWidths=[5*cm, 10*cm])
env_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
]))
story.append(env_table)
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("Após adicionar todas as variáveis, clique em 'Deploy' para iniciar o processo de build e deploy. A Vercel irá clonar seu repositório, instalar as dependências, compilar o projeto e publicar automaticamente.", tip_style))

# Section 6
story.append(Paragraph("<b>6. Executar Migrações do Banco</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Depois do deploy, o banco de dados está vazio. Você precisa criar as tabelas executando as migrações do Prisma. Existem duas formas de fazer isso, dependendo de como você configurou o projeto.", body_style))

story.append(Paragraph("<b>Opção A: Via linha de comando (recomendado)</b>", h2_style))
story.append(Paragraph("No seu computador local, com a DATABASE_URL de produção no arquivo .env:", body_style))

migrate_commands = [
    "npx prisma migrate deploy",
    "# ou se estiver usando bun:",
    "bunx prisma migrate deploy"
]

for cmd in migrate_commands:
    story.append(Paragraph(cmd, code_style))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("<b>Opção B: Via seed automático</b>", h2_style))
story.append(Paragraph("Se o projeto tem um script de seed configurado (prisma/seed.ts), você pode executá-lo para criar as tabelas e dados iniciais. Este script cria automaticamente as estruturas necessárias e pode incluir dados de exemplo como categorias de produtos.", body_style))
story.append(Paragraph("bunx prisma db seed", code_style))

story.append(Paragraph("Alternativamente, você pode usar o prisma db push para criar as tabelas sem migrações formais, o que é mais simples para projetos pequenos:", body_style))
story.append(Paragraph("bunx prisma db push", code_style))

# Section 7
story.append(Paragraph("<b>7. Testar o Sistema em Produção</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Após o deploy e migrações, acesse a URL fornecida pela Vercel (algo como padaria-paula.vercel.app) e teste todas as funcionalidades principais do sistema para garantir que tudo está funcionando corretamente.", body_style))

story.append(Paragraph("<b>Checklist de testes:</b>", h2_style))

tests = [
    "Acesso à página principal - O sistema carrega corretamente",
    "Cadastro de clientes - Consegue cadastrar um novo cliente",
    "Cadastro de produtos - Consegue cadastrar produtos normais e especiais",
    "Criação de pedidos - Consegue criar um pedido completo",
    "Impressão de recibos - Os recibos são gerados corretamente",
    "Painel administrativo - Login admin funciona com a senha configurada",
    "Histórico de pedidos - Pedidos aparecem no histórico",
    "Orçamentos - Sistema de orçamentos funciona"
]

for test in tests:
    story.append(Paragraph(f"☐ {test}", bullet_style))

story.append(Paragraph("Se algo não funcionar, verifique os logs na Vercel em 'Deployments' → clique no deploy → 'Functions' ou 'Build Logs'.", tip_style))

# Section 8
story.append(Paragraph("<b>8. Manutenção e Atualizações</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Uma das grandes vantagens da Vercel é a integração com o GitHub. Toda vez que você fazer push para a branch main, a Vercel automaticamente faz um novo deploy. Isso significa que para atualizar o sistema, basta enviar as alterações para o GitHub.", body_style))

story.append(Paragraph("<b>Para atualizar o sistema:</b>", h2_style))

update_steps = [
    "Faça as alterações necessárias no código",
    "Teste localmente se possível (bun run dev)",
    'git add . && git commit -m "Descrição da atualização"',
    "git push origin main",
    "Aguarde o deploy automático (geralmente 1-2 minutos)"
]

for i, step in enumerate(update_steps, 1):
    story.append(Paragraph(f"{i}. {step}", bullet_style))

story.append(Paragraph("<b>Backup dos dados:</b>", h2_style))
story.append(Paragraph("O Supabase e outros provedores de PostgreSQL geralmente fazem backup automático. No Supabase, você pode verificar em Settings → Database → Backups. Recomenda-se também fazer backups manuais periodicamente exportando os dados.", body_style))

# Section 9
story.append(Paragraph("<b>9. Alternativas de Banco de Dados</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

# Table comparison
db_header = ParagraphStyle('DBHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white, alignment=TA_CENTER)
db_cell = ParagraphStyle('DBCell', fontName='SimHei', fontSize=9, alignment=TA_CENTER)

db_data = [
    [Paragraph("<b>Serviço</b>", db_header), Paragraph("<b>Armazenamento</b>", db_header), Paragraph("<b>Prós</b>", db_header), Paragraph("<b>Contras</b>", db_header)],
    [Paragraph("Supabase", db_cell), Paragraph("500 MB", db_cell), Paragraph("Interface completa, fácil de usar", db_cell), Paragraph("Limite de 2 projetos gratuitos", db_cell)],
    [Paragraph("Neon", db_cell), Paragraph("3 GB", db_cell), Paragraph("Muito armazenamento, branches", db_cell), Paragraph("Interface menos intuitiva", db_cell)],
    [Paragraph("Vercel Postgres", db_cell), Paragraph("256 MB", db_cell), Paragraph("Integrado na Vercel", db_cell), Paragraph("Menos armazenamento", db_cell)],
    [Paragraph("Railway", db_cell), Paragraph("$5 crédito/mês", db_cell), Paragraph("Fácil configuração", db_cell), Paragraph("Crédito pode acabar", db_cell)],
]

db_table = Table(db_data, colWidths=[3*cm, 3*cm, 5*cm, 4*cm])
db_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(db_table)

# Section 10
story.append(Paragraph("<b>10. Custos e Limites do Plano Gratuito</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Tanto a Vercel quanto os provedores de PostgreSQL oferecem planos gratuitos generosos que são suficientes para a maioria dos pequenos negócios. É importante conhecer os limites para evitar surpresas.", body_style))

story.append(Paragraph("<b>Limites da Vercel (plano Hobby/Gratuito):</b>", h2_style))

vercel_limits = [
    "Largura de banda: 100 GB/mês",
    "Funções Serverless: 100 GB-horas/mês",
    "Builds: 6000 minutos/mês",
    "Domínios customizados: ilimitado",
    "HTTPS/SSL: incluído gratuitamente"
]

for limit in vercel_limits:
    story.append(Paragraph(f"• {limit}", bullet_style))

story.append(Paragraph("<b>Quando considerar plano pago:</b>", h2_style))
story.append(Paragraph("Se a padaria crescer e o sistema tiver muitos acessos, você pode precisar fazer upgrade. O plano Pro da Vercel custa $20/mês e inclui mais recursos, SLA de 99.9% de uptime, e suporte prioritário.", body_style))

story.append(Spacer(1, 1*cm))

# Final notes
story.append(Paragraph("<b>Próximos Passos</b>", h2_style))
story.append(Paragraph("Agora você tem todas as informações necessárias para colocar o sistema da Padaria Paula em produção. Se tiver dúvidas durante o processo, consulte a documentação da Vercel em vercel.com/docs ou do Supabase em supabase.com/docs.", body_style))

story.append(Paragraph("Recomenda-se fazer o deploy em um fim de semana ou horário de menor movimento para ter tempo de testar tudo antes de usar em produção real com clientes.", tip_style))

# Build PDF
doc.build(story)
print(f"PDF criado com sucesso: {pdf_path}")
