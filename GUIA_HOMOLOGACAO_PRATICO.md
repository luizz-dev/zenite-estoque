# Como Usar o Ambiente de Homologação de NFe

## 🎯 Objetivo

Este guia te ajuda a montar um ambiente de teste (homologação) para NFe.

---

## 📋 Pré-requisitos

# 1. Certificado Digital

Você precisa de um certificado em formato **.pfx** ou **.pem**

**Opções:**

| Tipo | Quando usar | Válido em |
|------|-----------|----------|
| **Certificado de Teste** | Desenvolvimento e testes | Apenas Homologação |
| **Certificado A1 Real** | Desenvolvimento, testes e produção | Ambos os ambientes |

**Onde obter certificado de teste:**
- Acesse: https://www.nfe.fazenda.gov.br/portal/
- Procure por "Certificado de Teste" ou "Certificado para Homologação"
- Siga as instruções de download

# 2. Composer e PHP

```bash
# Verificar PHP
php --version      # Deve ser 8.0+

# Verificar Composer
composer --version
```

# 3. Dependências instaladas

```bash
# Na raiz do projeto, execute:
composer install

# Isto instalará: nfephp-org/sped-nfe e dependências
```

---

## 🚀 Guia Passo a Passo

# **PASSO 1: Preparar Certificado Digital**

```bash
# 1. Coloque seu certificado em um diretório seguro
# Exemplo no Windows:
mkdir C:\nfe\certificates
cp seu-certificado-teste.pfx C:\nfe\certificates\

# Exemplo no Linux:
mkdir -p /opt/nfe/certificates
sudo cp seu-certificado-teste.pfx /opt/nfe/certificates/
sudo chmod 600 /opt/nfe/certificates/seu-certificado-teste.pfx
```

**IMPORTANTE:** Não colocar certificados publicamente. Restringir permissões

---

# **PASSO 2: Configurar Variáveis de Ambiente**

**Opção A: Usando .env.homologacao (RECOMENDADO)**

```bash
# Abra o arquivo .env.homologacao na raiz do projeto
# E preencha:

NFE_ENVIRONMENT=homologacao
NFE_CERTIFICATE_PATH=C:\nfe\certificates\seu-certificado.pfx
NFE_CERTIFICATE_PASSWORD=senha_do_certificado
NFE_CNPJ=34.028.316/0001-02
```

**Opção B: Usando variáveis de sistema (Linux)**

```bash
export NFE_ENVIRONMENT=homologacao
export NFE_CERTIFICATE_PATH=/opt/nfe/certificates/certificado.pfx
export NFE_CERTIFICATE_PASSWORD=sua_senha
export NFE_CNPJ=34.028.316/0001-02
```

**Opção C: Usando arquivo .env local**

```bash
# Copie o modelo
cp .env.example .env.local

# Edite com seus dados
nano .env.local  # ou seu editor
```

---

# **PASSO 3: Instanciar a Classe NFeConfig**

```php
<?php
// No início do seu arquivo que usa NFe

require_once 'NFeConfig.php';

$config = new NFeConfig();

// Verificar se está tudo certo
$validation = $config->validate();

if (!$validation['valid']) {
    echo "Erros de configuração:\n";
    foreach ($validation['errors'] as $error) {
        echo "❌ " . $error . "\n";
    }
    exit(1);
}

// Mostrar ambiente atual
echo "✅ Ambiente: " . $config->getEnvironmentName() . "\n";
echo "⚠️ " . $config->getEnvironmentWarning() . "\n";
echo "📍 CNPJ: " . $config->getCnpj() . "\n";
echo "🔐 Certificado: " . basename($config->getCertificatePath()) . "\n";
```

---

# **PASSO 4: Usar com a Biblioteca NFe**

```php
<?php
require_once 'NFeConfig.php';
require_once 'vendor/autoload.php';

use NFePHP\NFe\NFe;
use NFePHP\NFe\Tools;

// Carregar configuração
$config = new NFeConfig();

// Validar
if (!$config->validate()['valid']) {
    throw new \Exception("Configuração inválida");
}

// Instanciar Tools (que fará a comunicação com a Receita Federal)
$tools = new Tools(
    json_encode([
        'atualizacao' => date('d-m-Y H:i:s'),
        'tpAmb' => $config->getAmbientCode(), // 1 = Produção, 2 = Homologação
        'idLote' => 1,
        'indSinc' => 0,
        'versaoXML' => $config->getSettings()['nfe_version'],
    ]),
    $config->getCertificatePath(),
    $config->getCertificatePassword(),
    $config->getEnvironment(),
    // ... outros parâmetros
);

// Agora usar $tools para:
// $nfe = $tools->assinaXML($xml);
// $response = $tools->sefazEnviaNFe($xml);
// etc
?>
```

---

## 🧪 Testanto em Homologação

# **Teste 1: Validar Certificado**

```php
try {
    $config = new NFeConfig();
    $validator = $config->validate();
    
    if ($validator['valid']) {
        echo "✅ Certificado está OK!\n";
        echo "Caminho: " . $config->getCertificatePath() . "\n";
        echo "CNPJ: " . $config->getCnpj() . "\n";
    }
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage();
}
```

# **Teste 2: Gerar XML de NFe**

```php
// Gerar um XML mínimo de teste
$xml = '<?xml version="1.0"?>
<NFe>
    <infNFe Id="NFe34000101234567000102650010000000021234567890" versao="4.00">
        <ide>
            <cUF>35</cUF>
            <natOp>VENDA</natOp>
            <mod>55</mod>
            <serie>900</serie>
            <nNF>2</nNF>
            <dhEmi>2024-09-23T10:30:00-03:00</dhEmi>
            <dhSaiEnt>2024-09-23T10:30:00-03:00</dhSaiEnt>
            <tpNF>1</tpNF>
            <idDest>1</idDest>
            <cMunFG>3500308</cMunFG>
            <tpImp>1</tpImp>
            <tpEmis>1</tpEmis>
            <cDV>0</cDV>
            <tpAmb>2</tpAmb>
            <finNFe>1</finNFe>
            <indFinal>1</indFinal>
            <indPres>1</indPres>
            <procEmi>0</procEmi>
            <verProc>1.0</verProc>
        </ide>
        <!-- ... restante do XML ... -->
    </infNFe>
</NFe>';

// Tentar assinar e enviar
// $tools->sefazEnviaNFe($xml);
```

# **Teste 3: Verificar Comunicação**

```php
$config = new NFeConfig();
echo "URL de Autorização: " . $config->getServiceUrl('authorization') . "\n";
echo "URL de Status: " . $config->getServiceUrl('status') . "\n";

// Para testes mais avançados, use:
// curl -v {url} para testar conectividade
```

---

## 🔄 Mudando Para Produção

Quando você estiver pronto:

# **1. Preparar Certificado Real**

```bash
# Coloque o certificado A1 (com CNPJ real) em local seguro
# Linux (recomendado para produção):
sudo mkdir -p /etc/ssl/nfe
sudo cp certificado-empresa.pfx /etc/ssl/nfe/
sudo chmod 600 /etc/ssl/nfe/certificado-empresa.pfx
sudo chown www-data:www-data /etc/ssl/nfe/certificado-empresa.pfx
```

# **2. Criar .env.producao**

```bash
# Copie a estrutura de .env.homologacao
cp .env.homologacao .env.producao

# Edite para produção
NFE_ENVIRONMENT=producao
NFE_CERTIFICATE_PATH=/etc/ssl/nfe/certificado-empresa.pfx
NFE_CERTIFICATE_PASSWORD=sua_senha  # NUNCA em repo!
NFE_CNPJ=seu.cnpj.real/0001-00
```

# **3. Mudar Varia de Ambiente (sem alterar código)**

```bash
# Linux/Docker:
export NFE_ENVIRONMENT=producao

# Windows:
set NFE_ENVIRONMENT=producao

# PowerShell:
$env:NFE_ENVIRONMENT="producao"
```

# **4. Verificar **

```php
$config = new NFeConfig();
echo $config->getEnvironmentName(); // Agora mostra "Produção"
echo $config->getAmbientCode();     // Agora retorna 1
```

---

## 📊 Checklist de Homologação

Antes de ir para produção, complete:

```
CERTIFICADO E CONFIGURAÇÃO
[  ] Certificado válido obtido
[  ] Certificado em local seguro (sem permissões públicas)
[  ] Variáveis .env preenchidas corretamente
[  ] NFeConfig.php validando sem erros

TESTES FUNCIONAIS
[  ] Emitir uma NFe de teste (série 900-999)
[  ] Consultar status da NFe
[  ] Cancelar uma NFe de teste
[  ] Verificar XML gerado

VALIDAÇÃO
[  ] XMLs validam contra schema NFe 4.0
[  ] Código de receita (NCM) correto
[  ] Impostos calculados corretamente
[  ] Valores bate com produto e documentação

COMUNICAÇÃO
[  ] Conexão com servidor de homologação OK
[  ] Resposta da Receita Federal recebida
[  ] Mensagens de erro interpretadas
[  ] Tratamento de erros funcionando

DOCUMENTAÇÃO
[  ] Log de testes salvos
[  ] Problemas encontrados documentados
[  ] Solução de cada problema registrada
[  ] Contador/Auditor informado do teste
```

---

## Troubleshooting

# **Erro: "Certificado não encontrado"**

```bash
# Verificar caminho
ls -la /opt/nfe/certificates/certificado.pfx

# Verificar permissões
stat /opt/nfe/certificates/certificado.pfx | grep Access

# Se permissão negada:
sudo chmod 644 /opt/nfe/certificates/certificado.pfx
```

### **Erro: "Senha do certificado incorreta"**

```php
// Verificar se variável está sendo lida
var_dump(getenv('NFE_CERTIFICATE_PASSWORD'));

// Tentar sem senha (alguns certificados não exigem)
// Consultar quem enviou o certificado
```

# **Erro: "Ambiente não detectado"**

```bash
# Verificar qual arquivo .env está sendo lido
echo $NFE_ENVIRONMENT

# Listar .env files
ls -la .env*

# Forçar variável
export NFE_ENVIRONMENT=homologacao
```

# **Erro: "Conexão recusada com servidor"**

```bash
# Verificar conectividade
ping homolog.nfe.fazenda.gov.br

# Testar HTTPS
curl -v https://homolog.nfe.fazenda.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx

# Pode ser firewall ou proxy
```

---

## 📚 Referências

- [Portal NFe da Receita Federal](https://www.nfe.fazenda.gov.br/)
- [Documentação SPED-NFe do GitHub](https://github.com/nfephp-org/sped-nfe)
- [Manual Técnico NFe v4.0](https://www.nfe.fazenda.gov.br/portal/informe.aspx)
- [Código de Estados IBGE](https://www.ibge.gov.br/explica/codigos.php)

---

## 💡 Dicas Finais

1. **Sempre testar em homologação primeiro**
   - Sem pressa, sem stress
   - Documento todos os erros
   - Use série 900-999 para marcar como teste

2. **Nunca hardcode dados sensíveis**
   - CNPJ OK em variável
   - Senha do certificado em secrets manager

3. **Automize o switching**
   ```bash
   # Criar script para trocar ambientes facilmente
   #!/bin/bash
   export NFE_ENVIRONMENT=$1
   echo "Ambiente configurado: $NFE_ENVIRONMENT"
   ```

4. **Log tudo**
   - Guarde XMLs enviados
   - Guarde respostas da Receita
   - Útil para auditoria e troubleshooting

---

**Pronto! Você agora tem um ambiente de homologação funcional sem alterar nenhuma linha de código!** 🚀
