# Dependências a instalar

Este projeto foi pensado para ser colado dentro do repositório que você já
tem (o que aparece no `next.config.ts`, `tsconfig.json` etc. da imagem que
você mandou). Ele **não** inclui um `package.json` novo para não sobrescrever
o seu — em vez disso, rode estes comandos na raiz do projeto depois de copiar
os arquivos:

```bash
# Cliente/servidor do banco (Prisma)
npm install @prisma/client
npm install -D prisma

# Autenticação mínima (hash de senha)
npm install bcryptjs
npm install -D @types/bcryptjs

# Ícones e gráficos usados nas telas
npm install lucide-react recharts
```

## Depois de instalar

```bash
# 1. Copie .env.example para .env e preencha DATABASE_URL
cp .env.example .env

# 2. Gera o cliente Prisma a partir do schema
npx prisma generate

# 3. Cria as tabelas no banco (primeira vez)
npx prisma migrate dev --name init

# 4. (Opcional) popula com dados de exemplo
npx prisma db seed

# 5. Roda o projeto
npm run dev
```

Para o passo 4 funcionar, adicione isto ao seu `package.json` (bloco novo,
no nível raiz do JSON, ao lado de "scripts"):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

E instale o `tsx` para rodar o seed em TypeScript:

```bash
npm install -D tsx
```
