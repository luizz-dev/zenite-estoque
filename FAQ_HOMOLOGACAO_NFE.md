# FAQ - Perguntas Frequentes sobre Homologação NFe

Respostas para as dúvidas mais comuns encontradas durante implementação.

---

## Dúvidas sobre Conceitos

### 01. O que é ambiente de homologação?

**R:** É um servidor de **testes** fornecido pela Receita Federal onde você pode:
- Testar sua geração de NFe
- Validar comunicação
- Treinar sem custos
- Emitir notas que **não têm valor fiscal**

É como um "sandbox" - seguro para fazer erros e aprender.

---

### 02. Qual a diferença entre homologação e produção?

**R:** Resumido:

| Aspecto | Homologação | Produção |
|---------|-------------|----------|
| **URL** | homolog.* | www.* |
| **Notas** | Sem valor | Com valor fiscal |
| **Série** | 900-999 | Real |
| **CNPJ** | Teste | Real |
| **Risco** | Nenhum | Alto |
| **Caso de erro** | Sem consequência legal | Problema sério |

---

### 03. Por que NÃO alterar o código?

**R:** Porque:

1. **Segurança**: Reduz risco de ir para produção com código de testes
2. **Confiabilidade**: Mesmo código que foi testado roda em produção
3. **Auditoria**: Fácil rastrear qual config foi usada
4. **Deploy**: Automático sem revisar código

---

### 04. O que é "separar código de configuração"?

**R:** 

```
❌ ERRADO:
  if ($ambiente == 'producao') {
      $url = 'www.nfe.fazenda.gov.br';  // Hardcoded
  } else {
      $url = 'homolog.nfe.fazenda.gov.br';
  }

✅ CERTO:
  $config = new NFeConfig();
  $url = $config->getServiceUrl();  // De .env
```

A configuração **fora** do código permite mudar de ambiente sem mexer em PHP.

---

## ❓ Dúvidas Técnicas

### 05. Qual arquivo .env usar?

**R:** Depende de onde o código está rodando:

```
Seu PC Dev:     .env.local (copie de .env.homologacao)
Servidor Staging: .env.homologacao (automático)
Servidor Prod:  .env.producao (automático)
```

A variável `NFE_ENVIRONMENT` decide qual usar.

---

### 06. O que fazer com arquivo .env em git?

**R:** **NUNCA commitar!**

Adicione ao `.gitignore`:
```
# Sem versioning
.env
.env.local
.env.*.local
.env.producao
  
# Sem certificados
*.pfx
*.pem
*.key
```

Porquê? Senhas e dados sensíveis ficariam públicos.

---

### 07. De onde vem a precedência: arquivo ou variável de ambiente?

**R:** Nesta ordem (primeira encontrada, usa aquela):

```
1. Variável de Ambiente (getenv)  ← Mais importante
   export NFE_ENVIRONMENT=homologacao
   
2. Arquivo .env.{environment}
   .env.homologacao
   
3. Arquivo .env.local
   .env.local
   
4. Arquivo .env genérico
   .env
   
5. Padrão (homologacao)  ← Menos importante
```

Isto permite flexibilidade:
- Dev local: .env.local
- Docker: Variável de ambiente injetada
- Prod: Secrets manager

---

### 08. Arquivo .env não está sendo lido!

**R:** Checklist:

- [ ] Arquivo existe? `ls .env.homologacao`
- [ ] Permissão de leitura? `chmod 644 .env*`
- [ ] Variável `NFE_ENVIRONMENT` está definida?
  ```bash
  echo $NFE_ENVIRONMENT
  ```
- [ ] Sem espaços ao redor de `=`?
  ```
  ✅ NFE_ENVIRONMENT=homologacao
  ❌ NFE_ENVIRONMENT = homologacao  (espaços)
  ```
- [ ] Linhas em branco no fim? Remove.

Teste:
```php
var_dump(getenv('NFE_ENVIRONMENT'));  // Deve não ser false
```

---

### 09. Como validar se configuração está correta?

**R:** Use NFeConfig:

```php
$config = new NFeConfig();
$validation = $config->validate();

if (!$validation['valid']) {
    echo "Erros:\n";
    foreach ($validation['errors'] as $error) {
        echo "• " . $error . "\n";
    }
}
```

Ou teste direto:
```php
$config = new NFeConfig();
echo $config->getEnvironmentName();        // Deve ser "Homologação"
echo $config->getCertificatePath();        // Arquivo deve existir
echo $config->getCnpj();                   // Deve ser 34.028.316/0001-02
```

---

## ❓ Dúvidas sobre Certificado

### 10. Que tipo de certificado preciso?

**R:** Depende:

| Cenário | Certificado | Válido em |
|---------|-----------|-----------|
| **Desenvolvendo** | Teste | Só Homologação |
| **Testando com cliente** | Teste ou Real | Homologação |
| **Produção Real** | A1 (Real) | Produção |

**Recomendação**: Comece com certificado de teste. Quando pronto, use real em ambos.

---

### 11. Onde obter certificado de teste?

**R:** 
1. Va em: https://www.nfe.fazenda.gov.br/portal/
2. Procure por "Certificado de Teste" ou "Homologação"
3. Baixe arquivo `.pfx`
4. Você receberá uma senha por email

---

### 12. Perdi a senha do certificado. E agora?

**R:**

1. **Se certificado é de teste**: Baixe um novo
2. **Se certificado é real**: Contacte AC (Autoridade Certificadora)
3. **Nunca coloque senha em código** - use .env ou secrets manager

---

### 13. Certificado deu erro "arquivo não encontrado"

**R:** Checklist:

```bash
# Verificar se arquivo existe
ls -la /path/to/certificado.pfx

# Se não existe, cheque:
# 1. Caminho está correto em .env?
nano .env.homologacao

# 2. Arquivo está no lugar?
ls -la ~/Downloads/certificado.pfx

# 3. Copiar para lugar seguro
cp ~/Downloads/certificado.pfx /opt/nfe/certificates/

# 4. Atualizar .env com novo caminho
# NFE_CERTIFICATE_PATH=/opt/nfe/certificates/certificado.pfx
```

---

### 14. Certificado deu erro "senha incorreta"

**R:** 

```php
// Verificar se PHP está lendo a senha
var_dump(getenv('NFE_CERTIFICATE_PASSWORD'));  
// Se mostrar false: não está no .env

// Tentar sem senha (alguns não têm)
// Consulte quem te enviou o certificado

// Certificados com espaços na senha
// ERRADO:
// NFE_CERTIFICATE_PASSWORD=minha senha 123

// CERTO (entre aspas):
// NFE_CERTIFICATE_PASSWORD="minha senha 123"
```

---

## ❓ Dúvidas sobre Serie e CNPJ

### 15. Que série usar em homologação?

**R:** **900 a 999**

A Receita reconhece como teste. Exemplo:
- 900, 901, 902... até 999

O sistema automaticamente rejeita série fora desta faixa em homologação.

---

### 16. Que CNPJ usar em homologação?

**R:** CNPJ de teste da Receita Federal:

```
34.028.316/0001-02
```

Este é o CNPJ oficial de teste. Use sempre.

(Ou você pode usar seu CNPJ real em testes - ambos funcionam)

---

### 17. O que acontece se usar série real em homologação?

**R:** 

1. Sistema vai rejeitar (se validação estiver ativa)
2. Ou Receita vai aceitar mas marcar como teste
3. Cliente não consegue usar para faturamento

**Sempre use série 900-999 em testes!**

---

### 18. E se usar série 900 em produção?

**R:** ❌ Problema sério!

1. Receita vai aceitar (é uma série válida)
2. Mas reconhecer como teste
3. Cliente não consegue usar para faturamento
4. Erro fiscal / contábil

**NFeConfig.php rejeita isto automaticamente!**

---

## ❓ Dúvidas sobre Deploy

### 19. Como trocar de homologação para produção?

**R:** Apenas 2 passos:

```bash
# 1. Copiar arquivo
cp .env.homologacao .env.producao

# 2. Preencher com dados reais
nano .env.producao
# Alterar:
# NFE_ENVIRONMENT=producao
# NFE_CERTIFICATE_PATH=/caminho/certificado-real.pfx
# NFE_CNPJ=seu.cnpj.real/0001-00

# 3. Usar em produção
export NFE_ENVIRONMENT=producao

# ✅ Pronto! Código não muda!
```

---

### 20. Preciso alterar código para ir para produção?

**R:** **NÃO!** 

```php
// Este código funciona em ambos:
$config = new NFeConfig();
$url = $config->getServiceUrl();

// Em homologação: retorna homolog.*
// Em produção: retorna www.*
//
// Sem alterar uma única linha!
```

---

### 21. Como fazer deploy automático?

**R:** Exemplo com Docker/Kubernetes:

```bash
# Em dev:
export NFE_ENVIRONMENT=homologacao

# Em produção:
export NFE_ENVIRONMENT=producao

# Seu código fica igual em todos os ambientes
docker run -e NFE_ENVIRONMENT=producao meu-app
```

---

## ❓ Dúvidas sobre Segurança

### 22. Posso colocar senha do certificado em .env.producao?

**R:** ❌ **NÃO RECOMENDADO**

**Porquê?** Se alguém tiver acesso ao servidor, vê a senha.

**O correto?** Usar gerenciador de secrets:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Variável de ambiente injetada no deploy

```bash
# NÃO:
NFE_CERTIFICATE_PASSWORD=minha_senha  # ❌ Em arquivo

# SIM:
export NFE_CERTIFICATE_PASSWORD=***   # ✅ Variável de sistema
```

---

### 23. Alguém commitou .env em git!

**R:** Dano mitigável:

```bash
# 1. Remover do git (sem deletar local)
git rm --cached .env.producao
git commit -m "Remove credenciais (arquivo já público)"

# 2. Adicionar ao .gitignore
echo ".env*" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"

# 3. CRÍTICO: Trocar senha/certificado!
# Se senha foi pública, gere novo certificado

# 4. Reescrever histórico (se for repositório privado)
git filter-branch ...  # complexo, consulte docs
```

---

### 24. Como proteger credenciais em CI/CD?

**R:**

```yaml
# .gitlab-ci.yml (GitLab)
deploy_produção:
  stage: deploy
  variables:
    NFE_ENVIRONMENT: producao
    NFE_CERTIFICATE_PASSWORD: $PROD_CERT_PASSWORD  # De CI/CD secrets
  script:
    - php minha-app.php
```

```yaml
# .github/workflows/deploy.yml (GitHub Actions)
env:
  NFE_ENVIRONMENT: producao
  NFE_CERTIFICATE_PASSWORD: ${{ secrets.PROD_CERT_PASSWORD }}
```

**Nunca** coloque secrets em código. Use CI/CD secrets.

---

## ❓ Dúvidas sobre Troubleshooting

### 25. NFeConfig::getEnvironment() retorna null

**R:**

```php
// Significa: nenhum ambiente foi detectado

// Solução:
// 1. Verificar .env files
ls -la .env*

// 2. Definir manualmente
putenv('NFE_ENVIRONMENT=homologacao');

// 3. Ou via shell
export NFE_ENVIRONMENT=homologacao
```

---

### 26. "Class NFeConfig not found"

**R:**

```php
// Esqueceu de require
require_once 'NFeConfig.php';  // ← Adicione isto

$config = new NFeConfig();
```

---

### 27. Recebo "Token expiration" ou timeout

**R:** Servidor pode estar lento:

```php
// Aumentar timeout
$config = new NFeConfig();
$timeout = $config->getTimeout();  // 30s em homolog, 60s em prod

// Use este timeout ao conectar
curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
```

---

### 28. "Série não permitida" em homologação

**R:** 

```php
// Verificar qual série você está usando
var_dump($numero_nota);  // Deve ser 900-999

// Classe valida automaticamente:
$config = new NFeConfig();
if ($config->isStaging() && $serie < 900) {
    die("Use série 900-999 em testes!");
}
```

---

### 29. Resposta vazia da Receita Federal

**R:**

1. Verificar conectividade:
   ```bash
   ping homolog.nfe.fazenda.gov.br
   ```

2. Verificar certificado:
   ```bash
   openssl pkcs12 -info -in certificado.pfx
   ```

3. Verificar XML:
   ```bash
   xmllint --noout meu-nfe.xml
   ```

4. Se erro persiste: Contactar suporte técnico da Receita

---

## ❓ Dúvidas sobre Próximos Passos

### 30. Completei homologação. E agora?

**R:** Checklist antes de produção:

- [ ] Todos testes em homologação passaram
- [ ] Contador/Auditor validou
- [ ] Cliente aceitou notas de teste
- [ ] Certificado A1 obtido
- [ ] .env.producao preenchido
- [ ] Backup do certificado feito
- [ ] Suporte técnico informado

---

### 31. Posso usar certificado de teste em produção?

**R:** ❌ **Não!** 

Certificado de teste:
- Expira rapidamente
- Não é reconhecido em produção
- Receita rejeita

Use certificado A1 (real) em produção.

---

### 32. Como fazer rollback se der problema em produção?

**R:**

```bash
# 1. Se foi deploy de config:
git revert HEAD                    # Voltar commit anterior
export NFE_ENVIRONMENT=homologacao # Voltar para testes

# 2. Se foi problema de certificado:
# Reverter para certificado anterior no gerenciador de secrets

# 3. Se foi bug de código:
git revert <commit> && npm run deploy

# 4. IMPORTANTE: Notificar cliente que operação foi revertida
```

---

## 💡 Dicas Extras

### 🔍 Debug: Como ver qual ambiente está ativo?

```php
$config = new NFeConfig();

echo "Ambiente: " . $config->getEnvironment() . "\n";
echo "Nome: " . $config->getEnvironmentName() . "\n";
echo "CNPJ: " . $config->getCnpj() . "\n";
echo "Certificado: " . $config->getCertificatePath() . "\n";
echo "URL Principal: " . $config->getServiceUrl('authorization') . "\n";

// Ou use array:
print_r($config->toArray());
```

### 📝 Debug: Ver conteúdo de .env

```bash
# Não mostrar senhas:
grep -v "PASSWORD" .env.local

# Mostrar só variáveis NFe:
grep "^NFE_" .env.local
```

### 🧪 Debug: Testar conectividade

```bash
# Curls para testar
curl -v https://homolog.nfe.fazenda.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx
curl -v https://www.nfe.fazenda.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx

# Com certificado:
curl -v --cert certificado.pfx --cert-type P12 --cacert ca.crt https://...
```

---

## 📚 Se Ainda Tiver Dúvida...

Consulte:

1. **[ORIENTACAO_NFE_HOMOLOGACAO.md](ORIENTACAO_NFE_HOMOLOGACAO.md)** - Teoria
2. **[GUIA_HOMOLOGACAO_PRATICO.md](GUIA_HOMOLOGACAO_PRATICO.md)** - Passo a passo
3. **[RESUMO_VISUAL.md](RESUMO_VISUAL.md)** - Diagramas
4. **Código de NFeConfig.php** - Comentários extensos
5. **[Portal NFe Receita Federal](https://www.nfe.fazenda.gov.br/)** - Oficial

---

**Última atualização: 23/09/2024**

Se encontrou alguma questão não respondida, abra uma issue ou contacte seu professor/mentor!
