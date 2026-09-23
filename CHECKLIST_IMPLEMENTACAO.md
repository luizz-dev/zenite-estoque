# ✅ Checklist de Implementação - Homologação NFe

Use este documento para acompanhar seu progresso na configuração do ambiente de homologação.

---

## 📋 Fase 1: Preparação (30 minutos)

### 1.1 Estudos

- [ ] Leu **ORIENTACAO_NFE_HOMOLOGACAO.md**
  - Entendo o que é homologação
  - Conheço as diferenças produção vs teste
  - Entendo o princípio de separação código/configuração

- [ ] Leu **RESUMO_VISUAL.md**
  - Entendi os diagramas
  - Respondi às questões de verificação
  - Fiz a analogia da TV Inteligente

- [ ] Leu **README_HOMOLOGACAO_NFE.md**
  - Conheço os arquivos criados
  - Entendo o fluxo QUick Start

### 1.2 Pré-Requisitos

- [ ] **PHP 8.0+** instalado
  ```bash
  php --version
  ```

- [ ] **Composer** instalado
  ```bash
  composer --version
  ```

- [ ] **SPED-NFe** instalado via composer
  ```bash
  composer install
  ```

- [ ] Posso ler/criar arquivos na raiz do projeto

---

## 📁 Fase 2: Preparar Arquivos (15 minutos)

### 2.1 Certificado Digital

- [ ] Obtive certificado digital (teste ou real)
  - Local: _________________________

- [ ] Arquivo em formato **.pfx** ou **.pem**

- [ ] Copiei certificado para local seguro
  ```bash
  # Linux/Mac
  mkdir -p /opt/nfe/certificates
  cp seu-certificado.pfx /opt/nfe/certificates/
  chmod 600 /opt/nfe/certificates/seu-certificado.pfx
  
  # Windows
  mkdir C:\nfe\certificates
  copy seu-certificado.pfx C:\nfe\certificates\
  ```

- [ ] Verifiquei se arquivo é acessível
  ```bash
  ls -l /opt/nfe/certificates/seu-certificado.pfx  # Linux
  # ou
  dir C:\nfe\certificates\seu-certificado.pfx      # Windows
  ```

- [ ] Tenho a **senha** do certificado
  - Guarde em local seguro (não em código!)

### 2.2 Arquivos do Projeto Já Criados

Verifique se existem na raiz do projeto:

- [ ] **NFeConfig.php** (500+ linhas)
  - Classe que gerencia ambientes
  
- [ ] **ORIENTACAO_NFE_HOMOLOGACAO.md** (200+ linhas)
  - Documentação teórica
  
- [ ] **GUIA_HOMOLOGACAO_PRATICO.md** (400+ linhas)
  - Passo a passo detalhado

- [ ] **RESUMO_VISUAL.md** (300+ linhas)
  - Diagramas e aprendizado

- [ ] **README_HOMOLOGACAO_NFE.md** (500+ linhas)
  - Este arquivo principal

- [ ] **EXEMPLO_EMISSAO_NFE.php** (250+ linhas)
  - Exemplo de uso em API

- [ ] **switch-nfe-environment.sh** (Linux/Mac)
  - Script para trocar ambientes

- [ ] **switch-nfe-environment.ps1** (Windows)
  - PowerShell script para trocar ambientes

---

## ⚙️ Fase 3: Configurar Arquivos .env (20 minutos)

### 3.1 Criar .env.homologacao

```bash
# Na raiz do projeto, execute:
cp .env.example .env.homologacao

# Ou crie manualmente:
cat > .env.homologacao << 'EOF'
NFE_ENVIRONMENT=homologacao
NFE_CERTIFICATE_PATH=/opt/nfe/certificates/seu-certificado.pfx
NFE_CERTIFICATE_PASSWORD=sua_senha_aqui
NFE_CNPJ=34.028.316/0001-02
EOF
```

Depois:

- [ ] Abri `.env.homologacao` no editor
- [ ] Preenchi `NFE_CERTIFICATE_PATH` com caminho CORRETO
  - Caminho: _____________________________________
  
- [ ] Preenchi `NFE_CERTIFICATE_PASSWORD` com senha do certificado
  - Verificação: Tentei abrir certificado com esta senha? ☐

- [ ] Deixei `NFE_CNPJ=34.028.316/0001-02` (CNPJ de teste)

- [ ] Salvei arquivo sem espaços extras
  - Verifico: Não tenho `NFE_CERTIFICATE_PATH = /path` (espaços)

- [ ] Arquivo está pronto para homologação

### 3.2 Criar .env.producao (para depois)

```bash
cp .env.homologacao .env.producao
```

Depois:

- [ ] Abri `.env.producao`

- [ ] Mudei primeira linha: `NFE_ENVIRONMENT=producao`

- [ ] Atualizei `NFE_CERTIFICATE_PATH` para certificado real
  - Mas NÃO faço isto ainda! (Só quando realmente for para produção)

- [ ] Atualizei `NFE_CNPJ` para seu CNPJ real
  - Mas NÃO faço isto ainda! (Só quando realmente for para produção)

- [ ] Salvei como rascunho para depois

- [ ] IMPORTANTE: `.env.producao` NÃO será commitado em git

### 3.3 Arquivo .env.local (seu PC)

- [ ] Criei `.env.local` copiando `.env.homologacao`
  ```bash
  cp .env.homologacao .env.local
  ```

- [ ] Modificações específicas do meu PC (se necessário)
  - `NFE_CERTIFICATE_PATH` aponta para diretório do meu PC
  
- [ ] Arquivo `.env.local` NÃO será commitado (adicionar a .gitignore)

### 3.4 Segurança: .gitignore

- [ ] Abri `.gitignore` na raiz do projeto

- [ ] Adicionei estas linhas:
  ```
  .env
  .env.local
  .env.*.local
  .env.producao
  ```

- [ ] Verifiquei que NÃO commitei arquivos `.env` em git

---

## 🧪 Fase 4: Testar NFeConfig.php (20 minutos)

### 4.1 Teste Básico

Crie arquivo `teste-nfe-config.php` na raiz:

```php
<?php
require_once 'NFeConfig.php';

echo "=== TESTE NFe CONFIG ===\n\n";

try {
    // 1. Instanciar
    $config = new NFeConfig();
    echo "✅ NFeConfig instanciado\n";
    
    // 2. Validar
    $validation = $config->validate();
    echo "\n--- VALIDAÇÃO ---\n";
    
    if ($validation['valid']) {
        echo "✅ Configuração VÁLIDA\n";
    } else {
        echo "❌ Configuração INVÁLIDA\n";
        echo "Erros:\n";
        foreach ($validation['errors'] as $error) {
            echo "  • " . $error . "\n";
        }
        exit(1);
    }
    
    // 3. Mostrar configuração
    echo "\n--- AMBIENTE ---\n";
    echo "Ambiente: " . $config->getEnvironmentName() . "\n";
    echo "Descrição: " . $config->getEnvironmentWarning() . "\n";
    
    // 4. Mostrar dados
    echo "\n--- DADOS ---\n";
    echo "CNPJ: " . $config->getCnpj() . "\n";
    echo "Certificado: " . basename($config->getCertificatePath()) . "\n";
    echo "URL: " . $config->getServiceUrl('authorization') . "\n";
    
    // 5. Verificar arquivo
    echo "\n--- ARQUIVO ---\n";
    if (file_exists($config->getCertificatePath())) {
        echo "✅ Certificado encontrado\n";
        echo "Tamanho: " . filesize($config->getCertificatePath()) . " bytes\n";
    } else {
        echo "❌ Certificado NÃO encontrado\n";
        echo "Procurando em: " . $config->getCertificatePath() . "\n";
    }
    
    echo "\n=== TESTES PASSARAM ===\n";
    
} catch (Exception $e) {
    echo "❌ ERRO: " . $e->getMessage() . "\n";
    exit(1);
}
?>
```

Execute:
```bash
php teste-nfe-config.php
```

Checklist:

- [ ] Script executou sem erros

- [ ] Vejo "✅ NFeConfig instanciado"

- [ ] Vejo "✅ Configuração VÁLIDA"

- [ ] Ambiente mostra: "Homologação (Testes)"

- [ ] CNPJ mostra: "34.028.316/0001-02"

- [ ] URL mostra: "homolog.nfe.fazenda.gov.br"

- [ ] Certificado mostra como encontrado "✅"

### 4.2 Teste de Mudança de Ambiente

Se tem `.env.producao` preenchido:

```bash
# Mudar para produção
export NFE_ENVIRONMENT=producao

# Executar teste
php teste-nfe-config.php

# Deve mostrar:
# - Ambiente: "Produção"
# - URL: "www.nfe.fazenda.gov.br"
# - código ambiente: 1 (não 2)
```

- [ ] Mudou para produção com sucesso
- [ ] Voltei para homologação: `export NFE_ENVIRONMENT=homologacao`

---

## 🚀 Fase 5: Integrar com Seu Código (30 minutos)

### 5.1 Onde Usar NFeConfig

Identifique em seu projeto:

- [ ] Localizei arquivo que emite NFe
  - Localização: _______________________________

- [ ] Localizei arquivo que consulta NFe
  - Localização: _______________________________

- [ ] Localizei arquivo que cancela NFe
  - Localização: _______________________________

### 5.2 Adicionar NFeConfig

Em cada arquivo encontrado:

```php
// No topo do arquivo:
require_once __DIR__ . '/../../NFeConfig.php';

// Depois:
$config = new NFeConfig();

// Usar em lugar de hardcode:
// ANTES:
// $ambient = 2;  // ❌ Hardcoded
// $url = 'https://homolog.nfe.fazenda.gov.br/...';

// DEPOIS:
// $ambient = $config->getAmbientCode();  // ✅ Dinâmico
// $url = $config->getServiceUrl('authorization');
```

- [ ] Atualizei arquivo de emissão

- [ ] Atualizei arquivo de consulta

- [ ] Atualizei arquivo de cancelamento

### 5.3 Testar Integração

```php
// No seu endpoint de teste:

$config = new NFeConfig();

// Tentar gerar XML
$xml = gerarXML($config);

// Assinar
$xmlAssinado = assinarXML($xml, $config->getCertificatePath());

// IMPORTANTE: Não enviar ainda!
// Só validar que consegue ler configuração
```

- [ ] Código consegue ler `$config->someMethod()`

- [ ] Nenhum erro de "classe não encontrada"

- [ ] Nenhum erro de certificado não encontrado

---

## 📊 Fase 6: Testes Funcionais (1 hora)

### 6.1 Teste 1: Gerar NFe de Teste

- [ ] Criei XML de NFe de teste
  - Série: 900-999
  - CNPJ: 34.028.316/0001-02
  - Dados mínimos válidos

- [ ] XML é válido contra schema v4.0
  - Ferramenta: ___________________

- [ ] XML possui assinatura digital

### 6.2 Teste 2: Conectar com Receita Federal

- [ ] Consegui conectar ao servidor de homologação
  ```bash
  curl -v https://homolog.nfe.fazenda.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx
  ```

- [ ] Resposta HTTP 200 ou similar (não erro de conexão)

- [ ] Sem erro de certificado SSL

### 6.3 Teste 3: Validação de Série

```php
$config = new NFeConfig();

if ($config->isStaging()) {
    // Deve aceitar série 900-999
    echo "✅ Aceita série de teste";
} else {
    // Deve rejeitar série 900-999
    echo "❌ Rejeita série de teste em produção";
}
```

- [ ] Code validation funciona

- [ ] Homologação aceita série 900-999

- [ ] Rejeita série menor que 900 em homologação

### 6.4 Teste 4: Mensagens de Erro

- [ ] Passei caminho errado de certificado
  - Retornou erro amigável ☐

- [ ] Passei senha errada
  - Retornou erro amigável ☐

- [ ] Passei CNPJ inválido
  - Retornou erro (ou deixou passar?) ☐

---

## 📚 Fase 7: Documentação (20 minutos)

### 7.1 Documentar Testes

Criar arquivo `TESTES_HOMOLOGACAO.md`:

```markdown
# Testes de Homologação NFe

Data: 23/09/2024
Testador: [Seu Nome]

## Testes Executados

### ✅ Teste 1: Conexão
- [ ] Conectou em homolog.nfe.fazenda.gov.br
- Tempo resposta: ___ms
- Status HTTP: 200

### ✅ Teste 2: Emissão
- [ ] Emitiu NFe série 900
- Protocolo: _______
- Tempo total: ___s

### ✅ Teste 3: Consulta
- [ ] Consultou status da NFe
- Status: Autorizada
- Tempo resposta: ___ms

### ❌ Problemas Encontrados
1. [Espaço em branco no .env causou erro]
   - Solução: Removido espaços
   
2. [...]

### ✅ Checklist Final
- [ ] Todos os testes passaram
- [ ] Documentação atualizada
- [ ] Pronto para produção? NÃO (faltam testes reais)
```

- [ ] Criei arquivo `TESTES_HOMOLOGACAO.md`

- [ ] Documentei todos os testes realizados

- [ ] Listei problemas e soluções

### 7.2 Documentar Próximos Passos

```markdown
# Próximos Passos para Produção

## Quando Migrar

- [ ] Todos os testes em homologação passaram
- [ ] Contador/Auditor validou
- [ ] Se cliente aceitou emissão de teste
- [ ] Certificado A1 obtido

## Mudanças Necessárias

1. Certificado:
   - Antes: certificado-teste.pfx
   - Depois: certificado-empresa.pfx
   
2. CNPJ:
   - Antes: 34.028.316/0001-02
   - Depois: XX.XXX.XXX/0001-XX

3. Série:
   - Antes: 900-999
   - Depois: Série real

4. Variável:
   - Antes: NFE_ENVIRONMENT=homologacao
   - Depois: NFE_ENVIRONMENT=producao

## Código

- [ ] Nenhuma linha será alterada
- [ ] Só mudar variáveis de ambiente
- [ ] Deploy sem risco
```

- [ ] Criei documentação de próximos passos

---

## ✨ Fase 8: Limpeza e Segurança (15 minutos)

### 8.1 .gitignore

- [ ] Adicionei `.env*` ao .gitignore

- [ ] Adicionei certificados ao .gitignore
  ```
  *.pfx
  *.pem
  *.crt
  *.key
  ```

- [ ] Verifiquei não commitei arquivos sensíveis
  ```bash
  git status  # Não deve mostrar .env ou certificados
  ```

### 8.2 Permissões de Arquivo

```bash
# Linux/Mac
chmod 600 .env.local
chmod 600 .env.homologacao
chmod 600 /opt/nfe/certificates/certificado.pfx
```

- [ ] Arquivo `.env.homologacao` só leitura para usuário

- [ ] Certificado não é legível por outros usuários

- [ ] Arquivo `.env.local` não será compartilhado

### 8.3 Limpeza de Teste

- [ ] Deletei arquivo `teste-nfe-config.php` (opcional, se quiser)

- [ ] Deletei XMLs de teste (opcional)

- [ ] Projeto está limpo para usar

---

## 🎉 Fase 9: Validação Final

### ✅ Checklist de Conclusão

- [ ] **Código**
  - [ ] NFeConfig.php presente
  - [ ] Importado em seus arquivos
  - [ ] Nada de .env hardcoded

- [ ] **Configuração**
  - [ ] .env.homologacao preenchido
  - [ ] .env.local pronto
  - [ ] .env.producao preparado (para depois)

- [ ] **Segurança**
  - [ ] .gitignore atualizado
  - [ ] Nenhum .env commitado
  - [ ] Nenhum certificado commitado
  - [ ] Nenhuma senha em código

- [ ] **Testes**
  - [ ] Conectou em homologação
  - [ ] Gerou XML válido
  - [ ] Validou série de testes
  - [ ] Pronto para emitir NFe

- [ ] **Documentação**
  - [ ] Leu orientações
  - [ ] Documentou testes
  - [ ] Planejou produção

---

## 📞 Próximo: Produção

Quando estiver pronto para produção:

1. Obter certificado A1 real
2. Preencher .env.producao com dados reais
3. Alterar variável: `export NFE_ENVIRONMENT=producao`
4. Fazer testes finais
5. Deploy com confiança ✅

---

## 💾 Template: Seu Progresso

```
Data de início: ___/___/2024
Fase 1: ___% (Preparação)
Fase 2: ___% (Arquivos)
Fase 3: ___% (Configuração)
Fase 4: ___% (Testes NFeConfig)
Fase 5: ___% (Integração)
Fase 6: ___% (Testes Funcionais)
Fase 7: ___% (Documentação)
Fase 8: ___% (Segurança)
Fase 9: ___% (Validação)

Conclusão: ___/___/2024
Total de horas: ___
Dificuldades encontradas: _______________
Lições aprendidas: _______________
```

---

**Parabéns! Você completou o setup de homologação!** 🚀

Salve este documento e consulte sempre que precisar.

*Última atualização: 23/09/2024*
