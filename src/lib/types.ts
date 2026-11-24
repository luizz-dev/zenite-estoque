// ============================================================================
// TIPOS COMPARTILHADOS — usados pelo front-end (components/) e pelas rotas
// de API (app/api/). Espelham os models do prisma/schema.prisma.
// ============================================================================

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  celular: string;
  cpfCnpj?: string | null;
  cep?: string | null;
  endereco?: string | null;
  formaPagamento?: string | null;
}

export interface Empresa {
  id: string;
  configurada: boolean;
  razaoSocial: string;
  cnpj: string;
  ie: string;
  uf: string;
  regime: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  certificadoNome: string;
}

// Variação de um produto (tamanho + cor), cada uma com seu estoque.
export interface VariacaoProduto {
  id: string;
  produtoId: string;
  tamanho: string;
  cor: string;
  sku: string;
  quantidade: number;
}

// Linha de variação enviada ao criar/editar um produto (id só existe em variações já salvas).
export interface VariacaoEntrada {
  id?: string;
  tamanho: string;
  cor: string;
  quantidade: number;
}

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  categoria: string;
  unidade: string;
  quantidade: number; // = soma das variações (mantida pelo servidor)
  quantidadeMinima: number;
  precoCusto: number;
  precoVenda: number;
  fornecedor?: string | null;
  ncm: string;
  descricao?: string | null;
  variacoes: VariacaoProduto[]; // sempre ao menos uma
}

export type StatusEstoque = "ativo" | "alerta" | "critico" | "esgotado";

export interface Destinatario {
  tipo: "PF" | "PJ";
  doc: string;
  nome: string;
  ie?: string;
  uf: string;
}

export interface EnderecoEntrega {
  [key: string]: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface ItemNotaFiscal {
  produtoId: string;
  variacaoId?: string | null; // variação vendida (obrigatória em notas novas)
  nome: string;
  sku: string;
  ncm: string;
  cfop: string;
  quantidade: number;
  valorUnitario: number;
}

export type StatusFiscal = "autorizada" | "pendente" | "rejeitada" | "cancelada";

export interface NotaFiscal {
  id: string;
  numero: number;
  destinatarioTipo: "PF" | "PJ";
  destinatarioDoc: string;
  destinatarioNome: string;
  destinatarioIe?: string | null;
  destinatarioUf: string;
  enderecoEntrega?: EnderecoEntrega | null;
  csosn: string;
  formaPagamento: string;
  valorTotal: number;
  statusFiscal: StatusFiscal;
  motivoRejeicao?: string | null;
  emitidaEm: string;
  itens: ItemNotaFiscal[];
}

// Payload enviado pelo front ao endpoint POST /api/notas
export interface NovaNotaPayload {
  destinatario: Destinatario;
  endereco: EnderecoEntrega | null;
  csosn: string;
  formaPagamento: string;
  itens: ItemNotaFiscal[];
  // NOVO: quando a nota é emitida a partir de uma venda registrada na baixa,
  // informe o id da movimentação. Nesse caso o estoque NÃO é debitado de novo
  // (já foi debitado na baixa) e a venda fica vinculada à nota.
  movimentacaoId?: string;
}

export type TipoNotificacao = "estoque" | "fiscal" | "mei" | "sistema";
export type Prioridade = "alta" | "media" | "baixa";

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  lida: boolean;
  criadoEm: string;
}

export interface Movimentacao {
  id: string;
  tipo: "entrada" | "saida";
  item: string;
  quantidade: number;
  motivo?: string | null;
  observacao?: string | null;
  data: string;
  // NOVO (baixa com motivo "Venda")
  valor?: number | null;      // valor total da venda (R$)
  produtoId?: string | null;  // produto movimentado
  notaId?: string | null;     // NF-e emitida para esta venda (null = sem nota ainda)
  variacaoId?: string | null; // variação (tamanho/cor) movimentada
}

export type TipoConta = "fixa" | "eventual";

export interface ContaFixa {
  id: string;
  nome: string;
  valor: number;
  categoria: string;
  diaVencimento: number;
  tipo: TipoConta;
  avisoAntecedenciaDias: number;
  criadoEm: string;
}

export type PlanoAssinatura = "mensal" | "anual";
export type StatusAssinatura = "ativa" | "cancelada";

export interface Assinatura {
  id: string;
  plano: PlanoAssinatura;
  status: StatusAssinatura;
  valor: number;
  formaPagamento: string;
  proximaCobranca?: string | null;
}