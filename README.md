# Zênite — Gestão de Estoque e NF-e

Sistema web de gestão para MEIs e microempresas, com controle de estoque, contas fixas, alertas e emissão de NF-e.

Projeto de TCC do curso Técnico em Desenvolvimento de Sistemas (Etec Jaraguá).

> **Status:** projeto acadêmico, executado localmente. Não está pronto para produção.

## Funcionalidades

- Cadastro e login por e-mail e senha, com opção de login com Google (veja as limitações)
- Dados separados por usuário
- Cadastro, edição e exclusão de produtos
- Entradas e saídas de estoque, com histórico
- Emissão de NF-e em modo simulado (padrão) ou com envio à SEFAZ
- Geração de DANFE em PDF para notas com XML armazenado
- Contas fixas com alerta de vencimento
- Dashboard com indicadores e gráficos
- Telas de assinatura com pagamento **demonstrativo** (nenhuma cobrança é feita)

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Interface | Next.js 15 (App Router), React 19, TypeScript, Recharts, Lucide |
| API | Route Handlers do Next.js, bcryptjs |
| Banco de dados | PostgreSQL, Prisma 5 |
| Serviço fiscal | PHP, NFePHP (sped-nfe, sped-da) |

## Arquitetura

```
Navegador ──> Next.js (telas + API) ──> Prisma ──> PostgreSQL
                      │
                      └── HTTP + token ──> Serviço PHP de NF-e ──> SEFAZ (modo real)
```

```
nfe/            serviço PHP: XML, emissão e DANFE
prisma/         schema, migrações e seed
public/         arquivos estáticos
src/
  app/          páginas e rotas da API
  components/   componentes de interface
  context/      estado global no cliente
  lib/          autenticação, banco, tipos e utilitários
```

## Como executar

### Pré-requisitos

- Node.js e npm
- PostgreSQL
- PHP e Composer, com as extensões exigidas pela NFePHP

### 1. Instalar

```bash
git clone https://github.com/luizz-dev/zenite-estoque.git
cd zenite-estoque
npm install
composer install
```

### 2. Configurar

Crie um arquivo `.env` na raiz. **Nunca envie esse arquivo ao GitHub.**

```env
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/zenite"

NFE_MODE="simulado"
NFE_SERVICE_URL="http://127.0.0.1:8081"
NFE_SERVICE_TOKEN="troque-por-um-valor-aleatorio-longo"

# Opcional: login com Google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APP_URL="http://localhost:3000"
```

### 3. Preparar o banco

```bash
npx prisma migrate dev
```

> As migrações atuais não incluem todas as mudanças do `schema.prisma` (por exemplo, `googleId`). Em desenvolvimento, o Prisma deve pedir o nome de uma nova migração para a diferença. Revise o SQL gerado.

Opcional, para dados de exemplo. **Atenção: o seed apaga todos os dados do banco.** Defina antes `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` (mínimo de 12 caracteres).

```bash
npx prisma db seed
```

### 4. Iniciar

O serviço PHP precisa receber as variáveis no ambiente do terminal. Em um terminal na raiz (Linux/macOS):

```bash
NFE_MODE=simulado NFE_SERVICE_TOKEN="mesmo-token-do-env" php -S 127.0.0.1:8081 nfe/nfe-service.php
```

No PowerShell:

```powershell
$env:NFE_MODE="simulado"; $env:NFE_SERVICE_TOKEN="mesmo-token-do-env"
php -S 127.0.0.1:8081 nfe/nfe-service.php
```

Em outro terminal:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Modos de emissão de NF-e

| Modo | O que faz |
|---|---|
| `simulado` (padrão) | Monta o XML e valida contra o schema. Não envia à SEFAZ; o protocolo é fictício. |
| `real` | Assina e envia à SEFAZ. Use `NFE_ENVIRONMENT=homologacao`. Requer certificado A1 válido (`NFE_CERTIFICATE_PATH` e `NFE_CERTIFICATE_PASSWORD`). |

O certificado gerado por `nfe/gerar_certificado_teste.php` é autoassinado e **não é aceito pela SEFAZ**. Notas de homologação não têm valor fiscal.

## Limitações conhecidas

- A autenticação é de protótipo: o cookie de sessão não é assinado
- Pagamentos e assinaturas são apenas demonstrativos
- A emissão de NF-e ainda precisa de tratamento seguro para falhas e notas pendentes
- O login com Google tem o fluxo de conclusão de cadastro incompleto
- Não há testes automatizados

## Equipe

Projeto desenvolvido por uma equipe de 4 pessoas.

**Luiz Eduardo Leite Alves**: liderança da equipe, interface visual, front-end e parte do back-end.
[GitHub](https://github.com/luizz-dev) · [LinkedIn](https://www.linkedin.com/in/luiz-alves-leite/)
**Luisa Sales**: Desiner, interface visual, front-end.
[GitHub](https://github.com/salescr) · [LinkedIn](https://www.linkedin.com/in/luisa-cristina-sales)
**Gabriel Lacerda**: Banco de Dados,Responsavel pela integração com o SEFAZ.
[GitHub](https://github.com/GabrielRLac)
**Aquiles Vinicius**: Documentação, parte do back-end, auxilar na integração de NFE.
[GitHub](https://github.com/AquilesVinicius)