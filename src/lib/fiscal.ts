// ============================================================================
// AVISO DE INCONSISTÊNCIA FISCAL (issue #20) — SÓ para rotas de API.
// Destino: src/lib/fiscal.ts
//
// Regra: no mês atual, se as UNIDADES vendidas na baixa de estoque (motivo
// "Venda") forem MAIORES que as unidades em NF-e AUTORIZADAS, o usuário
// recebe UMA notificação por mês. Se as notas alcançarem/superarem as
// saídas, o controle é zerado — e, se depois voltar a faltar nota no mesmo
// mês, um novo aviso pode ser dado.
// ============================================================================
import { MOTIVO_VENDA } from "@/lib/utils";
import type { Tx } from "@/lib/estoque-server";

export async function avaliarInconsistenciaFiscal(tx: Tx, usuarioId: string) {
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
  const competencia = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

  const saidas = await tx.movimentacao.aggregate({
    where: { usuarioId, tipo: "saida", motivo: MOTIVO_VENDA, data: { gte: inicio, lt: fim } },
    _sum: { quantidade: true },
  });
  const notas = await tx.itemNotaFiscal.aggregate({
    where: { nota: { usuarioId, statusFiscal: "autorizada", emitidaEm: { gte: inicio, lt: fim } } },
    _sum: { quantidade: true },
  });
  const unidadesSaidas = saidas._sum.quantidade ?? 0;
  const unidadesNfe = notas._sum.quantidade ?? 0;

  const estado = await tx.avisoFiscal.findUnique({ where: { usuarioId } });
  // Mudou o mês → o controle recomeça.
  let avisado = estado && estado.competencia === competencia ? estado.avisado : false;

  if (unidadesSaidas > unidadesNfe) {
    if (!avisado) {
      const diferenca = unidadesSaidas - unidadesNfe;
      await tx.notificacao.create({
        data: {
          usuarioId,
          tipo: "fiscal",
          titulo: "Possível inconsistência fiscal: saídas maiores que NF-e",
          descricao: `Neste mês foram vendidas ${unidadesSaidas} unidade(s) na baixa de estoque, mas só há ${unidadesNfe} em NF-e autorizadas (diferença de ${diferenca}). Emita as notas das vendas pendentes na tela de Histórico para regularizar.`,
          prioridade: "alta",
        },
      });
      avisado = true;
    }
  } else {
    avisado = false; // notas alcançaram as saídas: libera um novo aviso se voltar a faltar
  }

  await tx.avisoFiscal.upsert({
    where: { usuarioId },
    create: { usuarioId, competencia, avisado },
    update: { competencia, avisado },
  });
}