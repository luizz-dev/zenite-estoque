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

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  quantidadeMinima: number;
  precoCusto: number;
  precoVenda: number;
  fornecedor?: string | null;
  ncm: string;
  descricao?: string | null;
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
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface ItemNotaFiscal {
  produtoId: string;
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
}

export type TipoConta = "fixa" | "eventual";

export interface ContaFixa {
  id: string;
  nome: string;
  valor: number;
  categoria: string;
  diaVencimento: number;
  tipo: TipoConta;
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