# 🥖 Padaria Paula - Sistema de Pedidos

Sistema completo de pedidos com cupons térmicos para impressoras 80mm (ESC/POS).

## 📋 Funcionalidades

- ✅ Cadastro de clientes com busca por telefone
- ✅ Catálogo de produtos com diferentes tipos de venda (kg, gramas, unidade, cento)
- ✅ Cálculo automático de valores
- ✅ Geração de cupons para cliente (com valores) e cozinha (sem valores)
- ✅ Impressão em impressora térmica 80mm via Web Serial API
- ✅ Histórico de pedidos com reimpressão
- ✅ Painel administrativo para gerenciar produtos
- ✅ Design responsivo otimizado para tablet
- ✅ PWA instalável

## 🚀 Como Usar

### 1. Tela Inicial - Novo Pedido

1. Preencha os dados do cliente:
   - Nome (obrigatório)
   - Telefone (obrigatório)
   - Endereço (obrigatório)
   - CPF (opcional)
   - Observações (opcional)

2. Se o telefone já estiver cadastrado, os dados serão preenchidos automaticamente.

3. Clique em **"Iniciar Pedido"** para continuar.

### 2. Tela de Produtos

1. Navegue pelas categorias ou use a busca para encontrar produtos.
2. Digite a quantidade desejada para cada produto.
3. Clique no botão **"+"** para adicionar ao carrinho.
4. Acompanhe o carrinho na barra lateral direita.
5. Clique em **"Continuar"** para ir ao resumo.

### 3. Resumo do Pedido

1. Confira os dados do cliente e os itens do pedido.
2. Adicione observações gerais se necessário.
3. Clique em **"Finalizar Pedido"** para salvar.

### 4. Impressão de Cupons

1. Após salvar, você verá duas abas:
   - **Cupom do Cliente**: Com todos os valores
   - **Comanda Cozinha**: Sem valores (para produção)

2. Escolha o método de impressão:
   - **Imprimir**: Abre a janela de impressão do navegador
   - **Baixar TXT**: Salva o cupom como arquivo de texto

## 🖨️ Configurando a Impressora Térmica

### Método 1: Impressão via Navegador (Recomendado)

1. Conecte a impressora ao computador via USB.
2. Instale os drivers da impressora (Elgin, Epson, etc.).
3. Configure a impressora como padrão do Windows.
4. Na hora de imprimir, selecione a impressora na janela de impressão.

### Método 2: Web Serial API (Chrome/Edge)

1. Conecte a impressora via USB.
2. Clique no botão de impressão.
3. Selecione a porta serial da impressora quando solicitado.
4. A impressão será feita automaticamente.

### Configurações da Impressora

- **Papel**: 80mm (aprox. 42 caracteres por linha)
- **Comandos**: ESC/POS compatível
- **Marcas testadas**: Elgin I9, Epson TM-T20, Bematech MP-4200

## 📱 Área Administrativa

Clique em **"Admin"** na barra de navegação para:

- **Produtos**: Adicionar, editar, ativar/desativar produtos
- **Configurações**: Alterar dados da loja (nome, endereço, telefone, CNPJ)

### Adicionar Novo Produto

1. Preencha o nome do produto.
2. Selecione o tipo de venda:
   - **KG**: Para tortas e bolos vendidos por peso
   - **GRAMAS**: Para produtos vendidos em gramas
   - **UNIDADE**: Para salgados unitários
   - **CENTO**: Para docinhos e salgadinhos
3. Digite o valor unitário.
4. Selecione a categoria.
5. Clique em **"Adicionar"**.

## 📊 Histórico de Pedidos

Clique em **"Histórico"** na barra de navegação para:

- Ver todos os pedidos realizados
- Filtrar por data
- Buscar por número, nome ou telefone
- Visualizar detalhes do pedido
- Reimprimir cupons

## 🔧 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── clientes/route.ts    # API de clientes
│   │   ├── produtos/route.ts    # API de produtos
│   │   ├── pedidos/route.ts     # API de pedidos
│   │   └── configuracao/route.ts # API de configurações
│   ├── globals.css              # Estilos globais
│   ├── layout.tsx               # Layout principal
│   └── page.tsx                 # Página principal (SPA)
├── components/
│   ├── padaria/
│   │   ├── Header.tsx           # Cabeçalho
│   │   ├── Navigation.tsx       # Navegação
│   │   ├── ClienteForm.tsx      # Formulário de cliente
│   │   ├── ProdutosLista.tsx    # Lista de produtos
│   │   ├── Carrinho.tsx         # Carrinho lateral
│   │   ├── ResumoPedido.tsx     # Resumo do pedido
│   │   ├── ImpressaoManager.tsx # Gerenciador de impressão
│   │   ├── HistoricoPedidos.tsx # Histórico
│   │   └── AdminPanel.tsx       # Painel administrativo
│   └── ui/                      # Componentes shadcn/ui
├── lib/
│   ├── db.ts                    # Conexão Prisma
│   ├── escpos.ts                # Utilitários ESC/POS
│   └── utils.ts                 # Utilitários gerais
├── store/
│   ├── useAppStore.ts           # Estado da aplicação
│   └── usePedidoStore.ts        # Estado do pedido
└── prisma/
    ├── schema.prisma            # Schema do banco
    └── seed.ts                  # Dados iniciais
```

## 💾 Banco de Dados

O sistema utiliza **PostgreSQL** (via Supabase) em produção e **SQLite** para desenvolvimento local.

### Variáveis de Ambiente

Configure a variável `DATABASE_URL` no Vercel:

```
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.SEU_PROJECT_ID.supabase.co:5432/postgres"
```

### Comandos do Banco

```bash
# Gerar cliente Prisma
npm run db:generate

# Popular dados iniciais (desenvolvimento local)
npm run db:seed

# Sincronizar schema (desenvolvimento local)
npm run db:push
```

### Deploy no Vercel

1. Conecte o repositório GitHub ao Vercel
2. Configure a variável `DATABASE_URL` nas Environment Variables
3. O deploy será feito automaticamente

## 🌐 Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilização**: Tailwind CSS, shadcn/ui
- **Estado**: Zustand
- **Banco**: Prisma + PostgreSQL (Supabase)
- **Formulários**: React Hook Form + Zod
- **Ícones**: Lucide React
- **Impressão**: ESC/POS, Web Serial API

## 📝 Licença

Este projeto foi desenvolvido especificamente para a **Padaria Paula**.

---

Desenvolvido com ❤️ para a Padaria Paula
