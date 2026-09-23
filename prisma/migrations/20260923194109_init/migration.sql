-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `celular` VARCHAR(191) NOT NULL,
    `cpfCnpj` VARCHAR(191) NULL,
    `cep` VARCHAR(191) NULL,
    `endereco` VARCHAR(191) NULL,
    `formaPagamento` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empresa` (
    `id` VARCHAR(191) NOT NULL,
    `configurada` BOOLEAN NOT NULL DEFAULT false,
    `razaoSocial` VARCHAR(191) NOT NULL DEFAULT '',
    `cnpj` VARCHAR(191) NOT NULL DEFAULT '',
    `ie` VARCHAR(191) NOT NULL DEFAULT '',
    `uf` VARCHAR(191) NOT NULL DEFAULT 'SP',
    `regime` VARCHAR(191) NOT NULL DEFAULT 'MEI — Simples Nacional',
    `cep` VARCHAR(191) NOT NULL DEFAULT '',
    `rua` VARCHAR(191) NOT NULL DEFAULT '',
    `numero` VARCHAR(191) NOT NULL DEFAULT '',
    `bairro` VARCHAR(191) NOT NULL DEFAULT '',
    `cidade` VARCHAR(191) NOT NULL DEFAULT '',
    `certificadoNome` VARCHAR(191) NOT NULL DEFAULT '',
    `atualizadoEm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produtos` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `unidade` VARCHAR(191) NOT NULL DEFAULT 'UN',
    `quantidade` INTEGER NOT NULL DEFAULT 0,
    `quantidadeMinima` INTEGER NOT NULL DEFAULT 8,
    `precoCusto` DOUBLE NOT NULL,
    `precoVenda` DOUBLE NOT NULL,
    `fornecedor` VARCHAR(191) NULL,
    `ncm` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `produtos_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notas_fiscais` (
    `id` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `destinatarioTipo` VARCHAR(191) NOT NULL,
    `destinatarioDoc` VARCHAR(191) NOT NULL,
    `destinatarioNome` VARCHAR(191) NOT NULL,
    `destinatarioIe` VARCHAR(191) NULL,
    `destinatarioUf` VARCHAR(191) NOT NULL,
    `enderecoEntrega` JSON NULL,
    `csosn` VARCHAR(191) NOT NULL,
    `formaPagamento` VARCHAR(191) NOT NULL,
    `valorTotal` DOUBLE NOT NULL,
    `statusFiscal` VARCHAR(191) NOT NULL DEFAULT 'autorizada',
    `motivoRejeicao` VARCHAR(191) NULL,
    `emitidaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `notas_fiscais_numero_key`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contas_fixas` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `valor` DOUBLE NOT NULL,
    `categoria` VARCHAR(191) NOT NULL DEFAULT 'Outros',
    `diaVencimento` INTEGER NOT NULL DEFAULT 10,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'fixa',
    `avisoAntecedenciaDias` INTEGER NOT NULL DEFAULT 7,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assinatura` (
    `id` VARCHAR(191) NOT NULL,
    `plano` VARCHAR(191) NOT NULL DEFAULT 'mensal',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ativa',
    `valor` DOUBLE NOT NULL DEFAULT 49.9,
    `formaPagamento` VARCHAR(191) NOT NULL DEFAULT 'Cartão de Crédito',
    `proximaCobranca` DATETIME(3) NULL,
    `atualizadoEm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_nota_fiscal` (
    `id` VARCHAR(191) NOT NULL,
    `notaId` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `ncm` VARCHAR(191) NOT NULL,
    `cfop` VARCHAR(191) NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `valorUnitario` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimentacoes` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `item` VARCHAR(191) NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `motivo` VARCHAR(191) NULL,
    `observacao` VARCHAR(191) NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacoes` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `prioridade` VARCHAR(191) NOT NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `itens_nota_fiscal` ADD CONSTRAINT `itens_nota_fiscal_notaId_fkey` FOREIGN KEY (`notaId`) REFERENCES `notas_fiscais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_nota_fiscal` ADD CONSTRAINT `itens_nota_fiscal_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
