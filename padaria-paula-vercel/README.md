# Padaria Paula - Sistema de Gestão

Sistema completo para gerenciamento de pedidos, clientes, produtos e orçamentos para padarias.

## Deploy na Vercel + Supabase

### 1. Criar banco de dados no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings** → **Database**
4. Copie a **Connection string** (URI)

### 2. Configurar variáveis de ambiente na Vercel

```
DATABASE_URL="postgresql://postgres.[ID]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres.[ID]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
PIN_FUNCIONARIOS="2026"
ADMIN_PASSWORD="admin2026"
```

### 3. Deploy na Vercel

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy!

### 4. Após o deploy

Execute o seed para criar os produtos iniciais:

```bash
npx prisma db push
npx prisma db seed
```

## Credenciais

| Função | Senha |
|--------|-------|
| PIN Funcionários | `2026` |
| Senha Admin | `admin2026` |

## Funcionalidades

- ✅ Cadastro de clientes
- ✅ Gestão de produtos
- ✅ Pedidos com entrega
- ✅ Orçamentos
- ✅ Dashboard administrativo
- ✅ Impressão de cupons térmicos
- ✅ Histórico por cliente
- ✅ Backup e exportação

## Tecnologias

- Next.js 14
- React 18
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- Tailwind CSS
- shadcn/ui
