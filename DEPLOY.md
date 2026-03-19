# 🚀 Deploy Padaria Paula - Vercel + Supabase

## Passo 1: Criar Banco de Dados no Supabase

1. Acesse **https://supabase.com**
2. Clique em **"Start your project"**
3. Faça login com GitHub (ou crie conta)
4. Clique em **"New Project"**
5. Preencha:
   - **Name:** `padaria-paula-db`
   - **Database Password:** Crie uma senha forte e **ANOTE-A**
   - **Region:** São Paulo (sa-east-1)
6. Clique em **"Create new project"**
7. Aguarde ~2 minutos até o projeto ficar pronto

### Pegar a Connection String

1. No painel do Supabase, vá em **Settings** (ícone de engrenagem)
2. Clique em **Database**
3. Role até **Connection string**
4. Selecione **URI**
5. Copie a URL (será algo como):
   ```
   postgresql://postgres.xxxxx:YOUR-PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
6. Substitua `YOUR-PASSWORD` pela senha que você criou no passo 5

---

## Passo 2: Enviar Código para GitHub

No terminal, execute:

```bash
git init
git add .
git commit -m "Preparando para deploy"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/padaria-paula.git
git push -u origin main
```

---

## Passo 3: Deploy na Vercel

1. Acesse **https://vercel.com**
2. Clique em **"Sign Up"** ou **"Log In"**
3. Escolha **"Continue with GitHub"**
4. Autorize a Vercel
5. Clique em **"Add New..." → "Project"**
6. Encontre o repositório `padaria-paula`
7. Clique em **"Import"**

### Configurar Variáveis de Ambiente

ANTES de clicar em Deploy, adicione as variáveis:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres.[ID]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres` |
| `DIRECT_DATABASE_URL` | `postgresql://postgres.[ID]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres` |
| `ADMIN_PASSWORD` | Sua senha de admin (ex: `admin2026`) |
| `PIN_FUNCIONARIOS` | PIN de 4 dígitos (ex: `1234`) |

**Nota:** Use a MESMA senha nos dois URLs de banco de dados.

8. Clique em **"Deploy"**
9. Aguarde ~3 minutos

---

## Passo 4: Criar Tabelas no Banco

Após o deploy terminar:

### Opção A: Via Vercel CLI (recomendado)

1. Instale Vercel CLI: `npm i -g vercel`
2. No terminal do seu computador:
   ```bash
   # Clone o repositório
   git clone https://github.com/SEU-USUARIO/padaria-paula.git
   cd padaria-paula

   # Instale dependências
   bun install

   # Crie .env.local com suas variáveis
   # Cole as variáveis que você usou na Vercel

   # Gere o cliente Prisma
   bunx prisma generate

   # Crie as tabelas no banco
   bunx prisma db push

   # Popule com produtos iniciais
   bun run db:seed
   ```

### Opção B: Apenas rodar seed

Se o deploy já criou as tabelas automaticamente, só rode o seed:

```bash
bun run db:seed
```

---

## Passo 5: Testar

1. Acesse a URL fornecida pela Vercel (ex: `padaria-paula.vercel.app`)
2. Teste:
   - [ ] Página carrega
   - [ ] Cadastrar cliente
   - [ ] Cadastrar produto
   - [ ] Criar pedido
   - [ ] Acessar painel admin (senha que você definiu)

---

## 🆘 Problemas Comuns

### Erro de conexão com banco
- Verifique se as senhas nos URLs estão corretas
- Verifique se usou `6543` no DATABASE_URL e `5432` no DIRECT_DATABASE_URL

### Tabelas não existem
- Rode `bunx prisma db push` localmente com as variáveis de produção

### Build falhou
- Verifique os logs na Vercel
- Certifique-se que o `postinstall` está no package.json

---

## 📞 Suporte

Se tiver problemas, verifique:
1. Logs da Vercel (Deployments → clique no deploy → Build Logs)
2. Logs do Supabase (Logs → Postgres logs)
