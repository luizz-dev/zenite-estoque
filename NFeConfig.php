<?php
/**
 * Gerenciador de Configuração de NFe
 * 
 * PROPÓSITO: Centralizar toda configuração de NFe em um único lugar
 * para permitir múltiplos ambientes (homologação, produção) sem 
 * alterar o código da aplicação.
 * 
 * PRINCÍPIO: Separar CONFIGURAÇÃO do CÓDIGO
 * 
 * USO:
 * 
 *   $config = new NFeConfig();
 *   $ambiente = $config->getEnvironment();  // 'homologacao' ou 'producao'
 *   $url = $config->getServiceUrl();        // URL do web service
 *   $cert = $config->getCertificatePath();  // Caminho do certificado
 * 
 */

class NFeConfig
{
    private string $environment;
    private array $settings = [];

    /**
     * Carrega configuração baseado no arquivo .env
     * 
     * PRECEDÊNCIA:
     * 1. Variável de ambiente NFE_ENVIRONMENT 
     * 2. Arquivo .env.local / .env
     * 3. Padrão: 'homologacao'
     */
    public function __construct()
    {
        $this->loadEnvironment();
        $this->loadSettings();
    }

    /**
     * Detecta qual ambiente usar
     * 
     * EXPLICAÇÃO:
     * - Procura primeiro em variáveis de ambiente do PHP/Sistema
     * - Se não encontrar, carrega do arquivo .env
     * - Se continuar não encontrando, usa homologação como padrão
     */
    private function loadEnvironment(): void
    {
        // 1. Tenta variável de ambiente do sistema
        $env = getenv('NFE_ENVIRONMENT');
        
        if ($env === false) {
            // 2. Tenta ler do .env local
            $envFile = $this->getEnvFilePath();
            if (file_exists($envFile)) {
                $this->loadEnvFile($envFile);
                $env = getenv('NFE_ENVIRONMENT') ?: 'homologacao';
            } else {
                // 3. Padrão seguro: homologação
                $env = 'homologacao';
            }
        }

        $this->environment = $env;
    }

    /**
     * Determina qual arquivo .env usar
     * 
     * ORDEM DE BUSCA:
     * 1. .env.{environment} (ex: .env.homologacao)
     * 2. .env.local
     * 3. .env
     */
    private function getEnvFilePath(): string
    {
        $baseDir = dirname(__FILE__);
        $environment = getenv('NFE_ENVIRONMENT') ?: 'homologacao';

        // Tenta arquivo específico do ambiente
        $envSpecific = "{$baseDir}/.env.{$environment}";
        if (file_exists($envSpecific)) {
            return $envSpecific;
        }

        // Tenta .env.local
        $envLocal = "{$baseDir}/.env.local";
        if (file_exists($envLocal)) {
            return $envLocal;
        }

        // Tenta .env
        return "{$baseDir}/.env";
    }

    /**
     * Carrega variáveis do arquivo .env
     * 
     * FORMATO ESPERADO:
     * 
     *   NFE_ENVIRONMENT=homologacao
     *   NFE_SERVICE_URL=https://homolog.nfe.fazenda.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx
     *   NFE_CERTIFICATE_PATH=/path/to/certificate.pfx
     *   NFE_CERTIFICATE_PASSWORD=suaSenha123
     *   NFE_CNPJ=34.028.316/0001-02
     *   NFE_TIMEOUT=30
     * 
     * OBS: Linhas com # no início são comentários
     */
    private function loadEnvFile(string $filePath): void
    {
        if (!file_exists($filePath)) {
            return;
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            // Ignora comentários
            if (str_starts_with(trim($line), '#')) {
                continue;
            }

            // Parse: KEY=VALUE
            if (str_contains($line, '=')) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim(trim($value), '\'"');

                putenv("{$key}={$value}");
                $_ENV[$key] = $value;
            }
        }
    }

    /**
     * Carrega todas as configurações de NFe
     * 
     * Centraliza as URLs, caminhos e dados necessários
     * para comunicação com servidores da Receita Federal
     */
    private function loadSettings(): void
    {
        if ($this->environment === 'producao') {
            $this->settings = $this->getProductionSettings();
        } else {
            // Padrão: homologação (ambiente seguro para testes)
            $this->settings = $this->getStagingSettings();
        }
    }

    /**
     * Configurações para HOMOLOGAÇÃO (testes)
     * 
     * CARACTERÍSTICAS:
     * - Conecta aos servidores de TESTE da Receita Federal
     * - Notas com série 900+ são reconhecidas como teste
     * - Aceita certificado de teste
     * - É seguro fazer testes aqui sem emitir notas reais
     */
    private function getStagingSettings(): array
    {
        return [
            'environment' => 'homologacao',
            'name' => 'Homologação (Testes)',
            'description' => 'Ambiente de teste - Notas aqui NÃO têm valor fiscal',
            
            // URLs dos web services da Receita Federal
            'service_urls' => [
                'authorization' => 'https://homolog.nfe.fazenda.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
                'consultation' => 'https://homolog.nfe.fazenda.gov.br/webservices/NFeConsultaCadastro4/NFeConsultaCadastro4.asmx',
                'status' => 'https://homolog.nfe.fazenda.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx',
                'cancellation' => 'https://homolog.nfe.fazenda.gov.br/webservices/NFeCancelamento4/NFeCancelamento4.asmx',
                'inutilization' => 'https://homolog.nfe.fazenda.gov.br/webservices/NFeInutilizacao4/NFeInutilizacao4.asmx',
            ],

            // CNPJ de teste (sempre igual)
            'test_cnpj' => '34.028.316/0001-02',

            // Série de teste (900-999 são reconhecidas como teste)
            'test_series' => [900, 901, 902, 903, 904, 905],

            // Timeout maior para testes
            'timeout' => 30,

            // Versão da NFe (geralmente 4.0)
            'nfe_version' => '4.00',

            // Ambiente IBGE
            'ambient_code' => 2, // 1 = Produção, 2 = Homologação
        ];
    }

    /**
     * Configurações para PRODUÇÃO (real)
     * 
     * ⚠️ ATENÇÃO: TUDO AQUI É REAL
     * 
     * CARACTERÍSTICAS:
     * - Conecta aos servidores REAIS da Receita Federal
     * - Notas emitidas aqui têm VALOR FISCAL
     * - Exigem certificado A1 com dados reais
     * - Qualquer erro aqui pode resultar em problemas legais
     * - Erros de comunicação devem ser reportados ao cliente
     */
    private function getProductionSettings(): array
    {
        return [
            'environment' => 'producao',
            'name' => 'Produção',
            'description' => 'Ambiente REAL - Notas aqui TÊM valor fiscal',
            
            // URLs dos web services da Receita Federal
            'service_urls' => [
                'authorization' => 'https://nfe.fazenda.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
                'consultation' => 'https://nfe.fazenda.gov.br/webservices/NFeConsultaCadastro4/NFeConsultaCadastro4.asmx',
                'status' => 'https://nfe.fazenda.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx',
                'cancellation' => 'https://nfe.fazenda.gov.br/webservices/NFeCancelamento4/NFeCancelamento4.asmx',
                'inutilization' => 'https://nfe.fazenda.gov.br/webservices/NFeInutilizacao4/NFeInutilizacao4.asmx',
            ],

            // Timeout menor em produção (deve ser rápido)
            'timeout' => 60,

            // Versão da NFe
            'nfe_version' => '4.00',

            // Ambiente IBGE
            'ambient_code' => 1, // 1 = Produção
        ];
    }

    /**
     * Retorna o ambiente atual
     * 
     * @return string 'homologacao' ou 'producao'
     */
    public function getEnvironment(): string
    {
        return $this->environment;
    }

    /**
     * Retorna toda a configuração
     * 
     * @return array Dicionário com todas as settings
     */
    public function getSettings(): array
    {
        return $this->settings;
    }

    /**
     * Retorna a descrição do ambiente
     * Útil para logs e mensagens ao usuário
     * 
     * @return string Ex: "Homologação (Testes)" ou "Produção"
     */
    public function getEnvironmentName(): string
    {
        return $this->settings['name'] ?? 'Desconhecido';
    }

    /**
     * Retorna descrição de aviso do ambiente
     * 
     * @return string Mensagem de alerta apropriada
     */
    public function getEnvironmentWarning(): string
    {
        return $this->settings['description'] ?? '';
    }

    /**
     * Obter URL de um serviço específico
     * 
     * EXEMPLO:
     *   $url = $config->getServiceUrl('authorization');
     * 
     * @param string $service Qual serviço: authorization, status, cancellation, etc
     * @return string URL completa do web service
     */
    public function getServiceUrl(string $service = 'authorization'): string
    {
        return $this->settings['service_urls'][$service] ?? '';
    }

    /**
     * Obter caminho do certificado digital
     * 
     * PRECEDÊNCIA:
     * 1. Variável de ambiente NFE_CERTIFICATE_PATH
     * 2. Variável no .env
     * 3. Retorna vazio (o código deve tratar erro)
     * 
     * @return string Caminho absoluto para arquivo .pfx
     */
    public function getCertificatePath(): string
    {
        return getenv('NFE_CERTIFICATE_PATH') ?: '';
    }

    /**
     * Obter senha do certificado
     * 
     * ⚠️ SEGURANÇA: 
     * - NUNCA coloque a senha em código
     * - Use variáveis de ambiente
     * - Em produção, use um gerenciador de secrets (Vault, AWS Secrets, etc.)
     * 
     * @return string Senha do certificado
     */
    public function getCertificatePassword(): string
    {
        return getenv('NFE_CERTIFICATE_PASSWORD') ?: '';
    }

    /**
     * Obter CNPJ a usar para emissão
     * 
     * @return string CNPJ formatado ou não
     */
    public function getCnpj(): string
    {
        if ($this->environment === 'homologacao') {
            // Em testes, pode usar CNPJ de teste
            return getenv('NFE_CNPJ') ?: $this->settings['test_cnpj'];
        }
        
        // Em produção, DEVE ser o CNPJ real
        return getenv('NFE_CNPJ') ?: '';
    }

    /**
     * Obter código de ambiente (IBGE)
     * 
     * @return int 1 = Produção, 2 = Homologação
     */
    public function getAmbientCode(): int
    {
        return $this->settings['ambient_code'] ?? 2;
    }

    /**
     * Obter timeout de conexão
     * 
     * @return int Tempo em segundos
     */
    public function getTimeout(): int
    {
        return $this->settings['timeout'] ?? 30;
    }

    /**
     * Verificar se está em modo de testes
     * 
     * @return bool true se homologação, false se produção
     */
    public function isStaging(): bool
    {
        return $this->environment === 'homologacao';
    }

    /**
     * Verificar se está em modo de produção
     * 
     * @return bool true se produção, false se homologação
     */
    public function isProduction(): bool
    {
        return $this->environment === 'producao';
    }

    /**
     * Validação de configuração
     * 
     * Verifica se os dados necessários foram preenchidos
     * 
     * @return array ['valid' => bool, 'errors' => array]
     */
    public function validate(): array
    {
        $errors = [];

        // Verificar certificado
        $certPath = $this->getCertificatePath();
        if (empty($certPath)) {
            $errors[] = 'NFE_CERTIFICATE_PATH não configurado';
        } elseif (!file_exists($certPath)) {
            $errors[] = "Arquivo de certificado não encontrado: {$certPath}";
        }

        // Verificar senha do certificado
        if (empty($this->getCertificatePassword())) {
            $errors[] = 'NFE_CERTIFICATE_PASSWORD não configurado';
        }

        // Verificar CNPJ
        if (empty($this->getCnpj())) {
            $errors[] = 'NFE_CNPJ não configurado';
        }

        // Verificar variáveis de ambiente
        if (empty($this->environment)) {
            $errors[] = 'NFE_ENVIRONMENT não detectado';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $this->isProduction() ? ['Você está em PRODUÇÃO!'] : []
        ];
    }

    /**
     * Exibir configuração atual (para debug)
     * 
     * CUIDADO: Não exibe senhas, mas exibe caminhos
     * Use apenas em logs seguros e desenvolvimento
     * 
     * @return array Configuração filtrada
     */
    public function toArray(): array
    {
        return [
            'environment' => $this->environment,
            'name' => $this->getEnvironmentName(),
            'description' => $this->getEnvironmentWarning(),
            'certificate_path' => $this->getCertificatePath(),
            'cnpj' => $this->getCnpj(),
            'ambient_code' => $this->getAmbientCode(),
            'timeout' => $this->getTimeout(),
            'service_urls' => $this->settings['service_urls'] ?? {},
            // Propositalmente não inclui: certificate_password
        ];
    }
}
