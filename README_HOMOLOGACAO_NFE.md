# 🎓 Guia Completo: Ambiente de Homologação para NFe

**Professor**: Você solicitou orientação sobre como montar um ambiente de homologação de NFe **sem alterar o código**. Aqui está a solução completa com explicações pedagógicas.

---

## 📚 Para Onde Começar

### 1️⃣ Leitura Essencial (30 min)

Comece por esta ordem:

1. **[ORIENTACAO_NFE_HOMOLOGACAO.md](ORIENTACAO_NFE_HOMOLOGACAO.md)** - Conceitos teóricos
   - O que é homologação
   - Por que separar código de configuração
   - Diferenças produção vs teste

2. **[RESUMO_VISUAL.md](RESUMO_VISUAL.md)** - Entender a arquitetura
   - Diagramas e fluxos
   - Como o sistema funciona
   - Verificação de aprendizado

3. **[GUIA_HOMOLOGACAO_PRATICO.md](GUIA_HOMOLOGACAO_PRATICO.md)** - Passo a passo
   - Setup completo
   - Testes práticos
   - Troubleshooting

### 2️⃣ Implementação Prática (1 hora)

Depois execute:

```bash
# 1. Crie os arquivos .env
cp .env.example .env.homologacao
cp .env.example .env.producao

# 2. Preencha com seus dados
nano .env.homologacao    # Configure para testes
nano .env.producao       # Configure para produção

# 3. Teste em seu código
php seu-arquivo.php      # Vai automaticamente usar .env.homologacao
```

### 3️⃣ Avançado: Automation (15 min)

Use os scripts para trocar ambientes facilmente:

**No Linux/Mac:**
```bash
./switch-nfe-environment.sh homologacao   # Para testes
./switch-nfe-environment.sh producao      # Para real
./switch-nfe-environment.sh status        # Ver status
```

**No Windows (PowerShell):**
```powershell
.\switch-nfe-environment.ps1 -Environment homologacao
.\switch-nfe-environment.ps1 -Environment producao
.\switch-nfe-environment.ps1 -Status
```

---

## 📁 Arquivos Criados

### 🔧 Arquivos de Código

| Arquivo | Propósito | Tamanho |
|---------|-----------|--------|
| **NFeConfig.php** | Gerenciador de ambiente | 450 linhas |
| **EXEMPLO_EMISSAO_NFE.php** | Como usar na API | 200 linhas |

### 📋 Arquivos de Configuração

| Arquivo | Propósito | Status |
|---------|-----------|--------|
| **.env.example** | Template para preencher | ⚠️ Preencha! |
| **.env.homologacao** | Config de testes | ⚠️ Preencha! |
| **.env.producao** | Config de produção | ⚠️ Preencha! |
| **.env.local** | Sua config pessoal | 🔒 Secreta |

### 📚 Arquivos de Documentação

| Arquivo | Conteúdo | Tempo |
|---------|----------|-------|
| **ORIENTACAO_NFE_HOMOLOGACAO.md** | Teoria + Arquitetura | 30 min |
| **RESUMO_VISUAL.md** | Diagramas + Verificação | 20 min |
| **GUIA_HOMOLOGACAO_PRATICO.md** | Passo a passo detalhado | 45 min |

### 🤖 Scripts de Automação

| Script | SO | Função |
|--------|----|----|
| **switch-nfe-environment.sh** | Linux/Mac/Docker | Trocar ambiente |
| **switch-nfe-environment.ps1** | Windows PowerShell | Trocar ambiente |

---

## 🎯 Conceito Chave (IMPORTANTE!)

### O Princípio da Separação

```
┌──────────────────────────────────┐
│   SEU CÓDIGO (NUNCA MUDA)        │
│                                  │
│   $config = new NFeConfig();    │
│   $tools = new Tools(...);      │
│   $tools->sefazEnviaNFe($xml);  │
└──────────────────┬───────────────┘
                   │
                   │ Lê de arquivo .env
                   │
        ┌──────────▼──────────┐
        │  .env.homologacao   │ ← Testes
        │   ou                │
        │  .env.producao      │ ← Real
        └─────────────────────┘

RESULTADO:
✅ Mesmo código, ambientes diferentes
✅ Sem alterar nenhuma linha
✅ Seguro e auditável
```

### Como Funciona

```php
// Seu código permanece 100% igual:

$config = new NFeConfig();  // ← Isto é tudo o que muda em comportamento

// A classe NFeConfig automaticamente:
// 1. Lê .env.homologacao OU .env.producao
// 2. Decide qual URL usar
// 3. Decide qual certificado carregar
// 4. Decide qual CNPJ usar

// Você não precisa fazer nada! 🎉
```

---

## 🚀 Quick Start (5 Minutos)

Se você está com pressa, faça isto:

### Passo 1: Preparar Certificado
```bash
# Coloque seu certificado em local seguro
mkdir -p /opt/nfe/certificates
cp seu-certificado-teste.pfx /opt/nfe/certificates/
```

### Passo 2: Criar .env.homologacao
```bash
cat > .env.homologacao << 'EOF'
NFE_ENVIRONMENT=homologacao
NFE_CERTIFICATE_PATH=/opt/nfe/certificates/seu-certificado-teste.pfx
NFE_CERTIFICATE_PASSWORD=sua_senha
NFE_CNPJ=34.028.316/0001-02
EOF
```

### Passo 3: Testar
```php
<?php
require_once 'NFeConfig.php';

$config = new NFeConfig();

// Validar
$validation = $config->validate();
if ($validation['valid']) {
    echo "✅ Pronto! Ambente de testes configurado";
    echo "Você está em: " . $config->getEnvironmentName();
    echo "URL: " . $config->getServiceUrl('authorization');
} else {
    echo "❌ Erros: " . json_encode($validation['errors']);
}
?>
```

---

## ⚠️ Pontos Críticos de Segurança

### ❌ NUNCA Faça Isto

```php
// ❌ ERRADO: Senha hardcoded
const CERTIFICATE_PASSWORD = 'minha_senha_123';

// Problema:
// - Aparece em histórico de git
// - Todos que lerem código sabem a senha
// - Pode ser exposto em logs
```

### ✅ Sempre Faça Assim

```php
// ✅ CERTO: Usar NFeConfig
$config = new NFeConfig();
$password = $config->getCertificatePassword(); // De .env

// Benefícios:
// - Senha nunca aparece em código
// - Diferente para cada ambiente
// - Facilita rotação de credenciais
// - Cada dev pode ter sua própria senha local
```

### 🔐 Para Produção

Use um **gerenciador de secrets**:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Docker Secrets

---

## 🧪 Testes Recomendados

### Teste 1: Validação de Configuração
```php
$config = new NFeConfig();
$result = $config->validate();
assert($result['valid'] === true, "Configuração inválida");
```

### Teste 2: Ambiente Correto
```php
if ($config->isStaging()) {
    echo "Em homologação: série 900-999 será aceita ✅";
}

if ($config->isProduction()) {
    echo "Em produção: série real obrigatória ⚠️";
}
```

### Teste 3: Certificado Acessível
```php
$certPath = $config->getCertificatePath();
assert(file_exists($certPath), "Certificado não encontrado");
```

---

## 📊 Fluxo Decisório

### Qual arquivo usar?

```
Você está em qual situação?

1. Desenvolvendo no seu PC local
   → Use: .env.local (copie de .env.homologacao)
   
2. Servidor de teste/homologação
   → Use: .env.homologacao (carregue automático)
   
3. Servidor de produção
   → Use: .env.producao (muito cuidado!)
   → Melhor: Use variável de ambiente do sistema

4. Docker/Kubernetes
   → Monte os secrets como variáveis de ambiente
   → O arquivo .env não precisa existir
```

### Ordem de precedência
```
1. Variável de ambiente (getenv)
2. Arquivo .env.{environment}
3. Arquivo .env.local
4. Arquivo .env
5. Valor padrão de segurança (homologacao)
```

---

## 🔄 Processo de Deploy

### Dev → Staging → Produção

```bash
# 1. DESENVOLVIMENTO (seu PC)
export NFE_ENVIRONMENT=homologacao
# Seu código testa com serie 900-999

# 2. STAGING (servidor de teste)
# Deploy carrega .env.homologacao automaticamente
# Testes finais com cliente

# 3. PRODUÇÃO (servidor real)
# Deploy carrega .env.producao automaticamente
# Goove! 🚀

# ✅ Nenhuma linha de código foi alterada em nenhuma etapa!
```

---

## 🆘 Troubleshooting

### Problema: "Ambiente não detectado"
```bash
# Verificar
echo $NFE_ENVIRONMENT
ls -la .env*

# Solução
export NFE_ENVIRONMENT=homologacao
```

### Problema: "Certificado não encontrado"
```bash
# Verificar
ls -la /path/to/certificate.pfx

# Solução
# Cheque .env.homologacao se caminho está correto
nano .env.homologacao
```

### Problema: "Senha incorreta"
```bash
# Verificar se .env está sendo lido
var_dump(getenv('NFE_CERTIFICATE_PASSWORD'));

# Lembrete: Não pode ter espaços em volta de =
NFE_CERTIFICATE_PASSWORD=sua_senha  # ✅ Certo
NFE_CERTIFICATE_PASSWORD = sua_senha # ❌ Errado (espaços)
```

---

## 🎓 Avaliação de Aprendizado

Para verificar se entendeu:

1. **O que muda quando você vai de homologação para produção?**
   - [ ] O código PHP
   - [ ] O arquivo .env.homologacao
   - [x] Apenas a variável NFE_ENVIRONMENT

2. **Por que separar configuração do código?**
   - [x] Cada ambiente tem dados diferentes
   - [x] Segurança (senhas fora do código)
   - [x] Facilita deploy automático
   - [x] Reduz erros humanos

3. **O que contém .env.producao?**
   - [x] Certificado real (A1)
   - [x] CNPJ real
   - [x] URL de produção (automático pela classe)
   - [ ] Versão de código diferente

---

## 📞 Próximas Ações

- [ ] Leia ORIENTACAO_NFE_HOMOLOGACAO.md (30 min)
- [ ] Leia RESUMO_VISUAL.md (20 min)
- [ ] Siga GUIA_HOMOLOGACAO_PRATICO.md (45 min)
- [ ] Obtenha certificado digital (teste e/ou real)
- [ ] Crie .env.homologacao com seus dados
- [ ] Crie .env.producao com seus dados (depois)
- [ ] Teste com seu código
- [ ] Documente problemas encontrados
- [ ] Consulte seu contador sobre série de teste

---

## 💡 Referências

- [Portal NFe Receita Federal](https://www.nfe.fazenda.gov.br/)
- [SPED-NFe GitHub](https://github.com/nfephp-org/sped-nfe)
- [Manual Técnico NFe 4.0](https://www.nfe.fazenda.gov.br/portal/informe.aspx)
- [12 Factor App - Config](https://12factor.net/config)

---

## 🎉 Parabéns!

Você agora tem um ambiente profissional e seguro para:
- ✅ Testar em homologação
- ✅ Ir para produção seguramente
- ✅ Auditar todas as operações
- ✅ Usar mesma código em qualquer ambiente

**Tudo isso sem alterar uma única linha de código!** 🚀

---

*Criado como orientação pedagógica de TCC - Última atualização: 23/09/2024*
