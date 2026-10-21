-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "formaPagamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa" (
    "id" TEXT NOT NULL,
    "configurada" BOOLEAN NOT NULL DEFAULT false,
    "razaoSocial" TEXT NOT NULL DEFAULT '',
    "cnpj" TEXT NOT NULL DEFAULT '',
    "ie" TEXT NOT NULL DEFAULT '',
    "uf" TEXT NOT NULL DEFAULT 'SP',
    "regime" TEXT NOT NULL DEFAULT 'MEI — Simples Nacional',
    "cep" TEXT NOT NULL DEFAULT '',
    "rua" TEXT NOT NULL DEFAULT '',
    "numero" TEXT NOT NULL DEFAULT '',
    "bairro" TEXT NOT NULL DEFAULT '',
    "cidade" TEXT NOT NULL DEFAULT '',
    "certificadoNome" TEXT NOT NULL DEFAULT '',
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "quantidadeMinima" INTEGER NOT NULL DEFAULT 8,
    "precoCusto" DOUBLE PRECISION NOT NULL,
    "precoVenda" DOUBLE PRECISION NOT NULL,
    "fornecedor" TEXT,
    "ncm" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "destinatarioTipo" TEXT NOT NULL,
    "destinatarioDoc" TEXT NOT NULL,
    "destinatarioNome" TEXT NOT NULL,
    "destinatarioIe" TEXT,
    "destinatarioUf" TEXT NOT NULL,
    "enderecoEntrega" JSONB,
    "csosn" TEXT NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "statusFiscal" TEXT NOT NULL DEFAULT 'autorizada',
    "motivoRejeicao" TEXT,
    "emitidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_fixas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Outros',
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "tipo" TEXT NOT NULL DEFAULT 'fixa',
    "avisoAntecedenciaDias" INTEGER NOT NULL DEFAULT 7,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "contas_fixas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinatura" (
    "id" TEXT NOT NULL,
    "plano" TEXT NOT NULL DEFAULT 'mensal',
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 49.9,
    "formaPagamento" TEXT NOT NULL DEFAULT 'Cartão de Crédito',
    "proximaCobranca" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_nota_fiscal" (
    "id" TEXT NOT NULL,
    "notaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "ncm" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "itens_nota_fiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT,
    "observacao" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_usuarioId_key" ON "empresa"("usuarioId");

-- CreateIndex
CREATE INDEX "produtos_usuarioId_idx" ON "produtos"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_usuarioId_sku_key" ON "produtos"("usuarioId", "sku");

-- CreateIndex
CREATE INDEX "notas_fiscais_usuarioId_idx" ON "notas_fiscais"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_usuarioId_numero_key" ON "notas_fiscais"("usuarioId", "numero");

-- CreateIndex
CREATE INDEX "contas_fixas_usuarioId_idx" ON "contas_fixas"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "assinatura_usuarioId_key" ON "assinatura"("usuarioId");

-- CreateIndex
CREATE INDEX "movimentacoes_usuarioId_idx" ON "movimentacoes"("usuarioId");

-- CreateIndex
CREATE INDEX "notificacoes_usuarioId_idx" ON "notificacoes"("usuarioId");

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_fixas" ADD CONSTRAINT "contas_fixas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinatura" ADD CONSTRAINT "assinatura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota_fiscal" ADD CONSTRAINT "itens_nota_fiscal_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota_fiscal" ADD CONSTRAINT "itens_nota_fiscal_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
