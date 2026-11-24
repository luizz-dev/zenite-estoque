// ============================================================================
// Helpers de estoque por variação — SÓ para rotas de API (usa Prisma).
// Destino: src/lib/estoque-server.ts
// ============================================================================
import type { Prisma } from "@prisma/client";
import { COR_UNICA, TAMANHO_UNICO, ordenarVariacoes, rotuloVariacao } from "@/lib/variacoes";

export type Tx = Prisma.TransactionClient;

/** Produto + variações ordenadas, no formato que o front-end espera. */
export const comVariacoesOrdenadas = <P extends { variacoes: { tamanho: string; cor: string }[] }>(produto: P): P => ({
  ...produto,
  variacoes: ordenarVariacoes(produto.variacoes),
});

/**
 * Garante que o produto tenha ao menos uma variação. Produtos criados antes
 * do recurso de variações ganham uma variação "Único / Única" com o estoque atual.
 */
export async function garantirVariacoes(tx: Tx, usuarioId: string, produtoIds?: string[]) {
  const semVariacao = await tx.produto.findMany({
    where: { usuarioId, variacoes: { none: {} }, ...(produtoIds ? { id: { in: produtoIds } } : {}) },
    select: { id: true, sku: true, quantidade: true },
  });
  if (semVariacao.length === 0) return;
  await tx.variacaoProduto.createMany({
    data: semVariacao.map((p) => ({ produtoId: p.id, usuarioId, tamanho: TAMANHO_UNICO, cor: COR_UNICA, sku: p.sku, quantidade: p.quantidade })),
    skipDuplicates: true,
  });
}

/**
 * Escolhe a variação a movimentar. Se o produto tem só uma, ela é usada
 * automaticamente; se tem várias, a variação precisa ser informada.
 */
export async function obterVariacao(tx: Tx, usuarioId: string, produtoId: string, variacaoId?: string | null) {
  await garantirVariacoes(tx, usuarioId, [produtoId]);
  const variacoes = await tx.variacaoProduto.findMany({ where: { produtoId, usuarioId } });
  if (variacaoId) {
    const v = variacoes.find((x) => x.id === variacaoId);
    if (!v) throw new Error("Variação não encontrada para este produto.");
    return v;
  }
  if (variacoes.length === 1) return variacoes[0];
  throw new Error("Selecione a variação (tamanho/cor) do produto.");
}

/** Recalcula Produto.quantidade como a soma das variações. */
export async function sincronizarQuantidadeProduto(tx: Tx, produtoId: string) {
  const soma = await tx.variacaoProduto.aggregate({ where: { produtoId }, _sum: { quantidade: true } });
  await tx.produto.update({ where: { id: produtoId }, data: { quantidade: soma._sum.quantidade ?? 0 } });
}

export const descreverVariacao = (v: { tamanho: string; cor: string }) => rotuloVariacao(v) || "Única";