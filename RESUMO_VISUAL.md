# Resumo Visual: Arquitetura de Homologação NFe

## 🎯 O Conceito Chave

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SEU CÓDIGO (imutável)                              │
│                                                                       │
│  function emitirNFe($dados) {                                        │
│      $config = new NFeConfig();  ← Isto é tudo que muda!            │
│      $tools = new Tools(...);                                        │
│      $tools->sefazEnviaNFe($xml);                                    │
│  }                                                                    │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼
        ┌──────────────────┐
        │   NFeConfig.php  │
        │   (30 linhas +   │
        │    comentários)  │
        └────────┬─────────┘
                 │
        ┌────────┴────────┐
        │ Lê de 3 lugares │
        │ nesta ordem:    │
        └────────┬────────┘
        │
        ├─ 1️⃣  Variável de Ambiente
        │   export NFE_ENVIRONMENT=homologacao
        │
        ├─ 2️⃣  Arquivo .env.{environment}
        │   .env.homologacao
        │   .env.producao
        │
        └─ 3️⃣  Arquivo .env genérico
            .env.local ou .env

                 │
        ┌────────▼────────────────────────┐
        │   Define qual URL usar:         │
        ├─────────────────────────────────┤
        │ Homologação:                    │
        │ homolog.nfe.fazenda.gov.br      │
        │                                 │
        │ Produção:                       │
        │ www.nfe.fazenda.gov.br          │
        └────────┬───────────────────────┘
                 │
        ┌────────▼────────────────────────┐
        │   Seu código recebe:            │
        └────────┬───────────────────────┘
                 │
        ✅ Mesma NFe é enviada
           para o lugar certo
           automaticamente!
```

---

## 🔄 Fluxo de Decisão

```
┌─────────────────────────────────────────┐
│  Você precisa emitir uma NFe            │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │  new NFeConfig()   │
       └───────┬───────┘
               │
       ┌───────▼──────────────────┐
       │  Qual ambiente atualmente?│
       └───────┬──────────────────┘
               │
         ┌─────┴─────┐
         │           │
         ▼           ▼
    HOMOLOG   PRODUÇÃO
       │           │
       ▼           ▼
    Série      Série
    900-999    Real
    │           │
    ▼           ▼
    ❌ Sem valor fiscal    ✅ COM valor fiscal
    ✅ Para testes          ⚠️  CUIDADO!
    ✅ Seguro fazer erro    ❌ Erro = problema sério
```

---

## 📁 Estrutura de Arquivos

```
zenite-estoque/
├── NFeConfig.php                      ← Gerenciador de ambiente
├── .env.homologacao                  ← Config de TESTES
├── .env.producao                      ← Config de REAL
├── .env.local (seu pc)               ← Config PESSOAL
│
├── src/
│   └── api/
│       └── notas/
│           └── emit.php              ← Seu endpoint
│
├── ORIENTACAO_NFE_HOMOLOGACAO.md     ← Este arquivo
├── GUIA_HOMOLOGACAO_PRATICO.md       ← Passo a passo
└── EXEMPLO_EMISSAO_NFE.php           ← Como usar

vendor/
└── nfephp-org/
    └── sped-nfe/                     ← Biblioteca (não altera)
```

---

## ⚙️ Como Trocar de Ambiente

### Cenário 1: Desenvolvimento no seu PC

```bash
# 1. Crie .env.local com dados de teste
echo "NFE_ENVIRONMENT=homologacao" > .env.local
echo "NFE_CERTIFICATE_PATH=/path/to/test-cert.pfx" >> .env.local
echo "NFE_CERTIFICATE_PASSWORD=senha" >> .env.local

# 2. Execute seu código
php src/api/notas/emit.php

# Resultado: Usa HOMOLOGAÇÃO automaticamente ✅
```

### Cenário 2: Testes em Servidor de Staging

```bash
# 1. Servidor carrega .env.homologacao
deploy.sh  

# 2. Todo código rodando neste servidor
# usa HOMOLOGAÇÃO automaticamente ✅
```

### Cenário 3: Produção

```bash
# 1. Servidor carrega .env.producao
# (ou variável ambiente do sistema)
export NFE_ENVIRONMENT=producao
export NFE_CERTIFICATE_PATH=/etc/ssl/nfe/cert.pfx
export NFE_CERTIFICATE_PASSWORD=***

# 2. TODO código rodando neste servidor
# usa PRODUÇÃO automaticamente ✅

# MAS: Nenhuma linha de código foi alterada!
```

---

## 🔐 Segurança

### ❌ Forma ERRADA (nunca faça isso!)

```php
// ❌ RUIM: Senha hardcoded
const CERT_PASSWORD = 'minha_senha_123';

// Problema:
// - Qualquer um que ler código sabe a senha
// - Aparece em histórico de git
// - Pode ser visto em logs
```

### ✅ Forma CERTA

```php
// ✅ BOM: Em variável de ambiente
$config = new NFeConfig();
$password = $config->getCertificatePassword();

// Por quê:
// - Senha não aparece em código
// - Cada ambiente tem sua própria senha
// - Pode ser injetada no sistema em runtime
// - Aparece em logs mascarada
```

---

## 🎓 Responda Estas Perguntas (Verificação de Aprendizado)

### 1. O que muda quando você vai de Homologação para Produção?

<details>
<summary>Clicar para ver resposta</summary>

**A variável de ambiente `NFE_ENVIRONMENT`**, que controla:
- URL do servidor (homolog vs real)
- Código de ambiente IBGE (2 vs 1)
- Certificado usado
- CNPJ usado

**O código NÃO muda nada!**

</details>

### 2. Por que usar `.env` em vez de colocar tudo no PHP?

<details>
<summary>Clicar para ver resposta</summary>

Porque:
- ✅ Cada ambiente tem configuração diferente
- ✅ Dados sensíveis ficam fora do código
- ✅ Facilita deploys automáticos
- ✅ Reduz erros humanos
- ✅ Permite auditoria (quem usou qual config)

</details>

### 3. O que acontece se você usar série 900 em Produção?

<details>
<summary>Clicar para ver resposta</summary>

A Receita Federal vai:
- ✅ Aceitar a NFe
- ⚠️ Mas marcar como teste/inválida
- ❌ Cliente não consegue usar para faturamento
- ❌ Erro fiscal

Por isso a classe `NFeConfig` valida e rejeita!

</details>

---

## 📋 Checklist Final

### Antes de usar a classe:

- [ ] Lido ORIENTACAO_NFE_HOMOLOGACAO.md
- [ ] Lido GUIA_HOMOLOGACAO_PRATICO.md
- [ ] Entendo como NFeConfig.php funciona
- [ ] Tenho certificado digital (teste ou real)
- [ ] Preencheu .env.homologacao
- [ ] Testei em desenvolvimento local
- [ ] Validei XML gerado
- [ ] Testei envio para Receita Federal

### Antes de ir para Produção:

- [ ] TODOS os itens acima ✅
- [ ] Preencheu .env.producao com dados REAIS
- [ ] Certificado A1 instalado e válido
- [ ] CNPJ real verificado
- [ ] Contador/Auditor informado
- [ ] Sistema de backup do certificado implementado
- [ ] Plano de contingência se server cair
- [ ] Logs de todas as operações funcionando

---

## 🚀 Próximas Ações

1. **Crie os arquivos .env locais**
   ```bash
   cp .env.example .env.homologacao
   cp .env.example .env.producao
   ```

2. **Preencha com dados de teste**
   ```bash
   nano .env.homologacao
   ```

3. **Instancie a classe em seu código**
   ```php
   require_once 'NFeConfig.php';
   $config = new NFeConfig();
   ```

4. **Teste em homologação**
   ```bash
   php src/api/notas/emit.php
   ```

5. **Valide a resposta da Receita Federal**

6. **Documente os testes**

7. **Prepare produção**

---

## 💡 Analogia para Entender

Pense assim: 

```
NFeConfig.php é como uma TV INTELIGENTE

- O CODIGO = as funcionalidades (ligar, mudo, volume)
- O AMBIENTE = o canal que você está assistindo (Netflix, HBO, etc)

Você não precisa trocar a TV para assistir canal diferente.
Só muda o CANAL (variável de ambiente).

A TV funciona igual, só o conteúdo (URL, certificado) muda!
```

---

Parabéns! Você agora domina os conceitos de ambiente de homologação para NFe! 🎉
