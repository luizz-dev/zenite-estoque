# Guia de Orientação: Ambiente de Homologação para NFe

## 1. Conceitos Fundamentais

### O que é um Ambiente de Homologação?

Um **ambiente de homologação** é um servidor de testes fornecido pela Fazenda Pública onde você pode:
- ✅ Testar sua geração de NFe
- ✅ Validar a comunicação com os servidores da Receita Federal
- ✅ Corrigir erros sem afetar notas reais
- ✅ Treinar sem custos

**Importante**: Notas emitidas em homologação:
- Não possuem valor fiscal
- Não podem ser faturadas ao cliente
- São descartadas pelo sistema da Receita Federal

---

## 2. Diferenças: Produção vs Homologação

### URLs de Acesso

| Ambiente | URL | Valor Fiscal | Uso |
|----------|-----|-------------|-----|
| **Produção** | `www.nfe.fazenda.gov.br` | ✅ Sim | Notas reais |
| **Homologação** | `homolog.nfe.fazenda.gov.br` | ❌ Não | Testes e validação |

### Certificados Digitais

- **Produção**: Certificado A1 com CPF/CNPJ real
- **Homologação**: Pode usar certificado de testes ou real

---

## 3. Estratégia de Configuração SEM Alterar Código

### Princípio: Separar Configuração do Código

```
Código (imutável) ← Variáveis de Ambiente (mutáveis) → Ambientes diferentes
```

### Você terá:
```
.env.local          → Desenvolvimento (seu computador)
.env.homologacao    → Homologação (testes)
.env.producao       → Produção (real)
```

---

## 4. Arquitetura da Solução

```plaintext
┌─────────────────────────────────────────────────────┐
│              Seu Código Next.js                      │
│         (NÃO PRECISA MUDAR NADA)                    │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────────────┐  ┌──────────────────────┐
│  NFeConfig.php       │  │  .env files          │
│  (Gerencia config)   │  │  (Variáveis de      │
│                      │  │   ambiente)         │
└──────────┬───────────┘  └──────────┬───────────┘
           │                         │
           └─────────────┬───────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
    ┌────────────────┐          ┌──────────────────┐
    │ Homologação    │          │   Produção       │
    │ (Testes)       │          │   (Real)         │
    └────────────────┘          └──────────────────┘
```

---

## 5. Implementação Passo a Passo

### Passo 1: Variáveis de Ambiente
- Criar `.env.homologacao` com configurações de testes
- Criar `.env.producao` com configurações reais
- Manter `.env.local` para desenvolvimento

### Passo 2: Classe de Configuração
- Criar `NFeConfig.php` que lê as variáveis
- A classe decide qual ambiente usar
- **O código que chama a classe não muda**

### Passo 3: Integração
- Importar a classe onde precisa usar NFe
- Usar `$config->getEnvironment()` para saber qual ambiente
- Usar `$config->getCertificatePath()` para obter caminho do certificado

---

## 6. O Que Muda Entre Ambientes

```php
// Exemplo do que NFeConfig.php controla:

HOMOLOGAÇÃO:
- URL: homolog.nfe.fazenda.gov.br
- Certificado: certificado-teste.pfx
- CNPJ: 34.028.316/0001-02 (CNPJ de teste)
- Timeout: 30s (menor)

PRODUÇÃO:
- URL: www.nfe.fazenda.gov.br
- Certificado: seu-certificado-real.pfx
- CNPJ: seu-cnpj-real.pfx
- Timeout: 60s (maior)
```

---

## 7. Como Usar em Produção

### Quando você estiver pronto:

1. Mudar para `.env.producao`
2. Colocar certificado real
3. Adicionar CNPJ real
4. **Nenhuma linha de código precisa mudar**

### Isto é Segurança:
- Reduz risco de erro
- Torna deployment previsível
- Facilita auditorias

---

## 8. Checklist de Homologação

- [ ] Certificado digital (teste ou real)
- [ ] Arquivo `.env.homologacao` preenchido
- [ ] `NFeConfig.php` instanciado e testado
- [ ] Testar geração de 1 NFe
- [ ] Testar cancelamento de NFe
- [ ] Testar consulta de status
- [ ] Documentar resultados
- [ ] Preparar `.env.producao` (cópia de homologação + dados reais)

---

## 9. Referências da Receita Federal

- **Manual de NFe**: https://www.nfe.fazenda.gov.br/portal/
- **Documentação Técnica**: Em `vendor/nfephp-org/sped-nfe/`
- **CNPJ de Teste**: `34.028.316/0001-02`

---

## Próximos Passos

Vou criar a estrutura completa para você:
1. ✅ `NFeConfig.php` - Gerencia ambientes
2. ✅ `.env.example` - Modelo para preenchimento
3. ✅ `.env.homologacao` - Configuração de testes
4. ✅ Instrução de uso
