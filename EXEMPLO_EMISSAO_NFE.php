<?php
/**
 * EXEMPLO DE USO: Emissão de NFe em Homologação

 * Este arquivo mostra como usar NFeConfig em um endpoint da sua API
 * SEM alterar nenhum código além deste exemplo

 * LOCALIZAÇÃO SUGERIDA: src/api/notas/emit.php ou similar
 * 
 * USO:
 *   POST /api/notas/emit
 *   {
 *       "numero": 2,
 *       "serie": 900,
 *       "cliente": {...},
 *       "itens": [...]
 *   }
 */

require_once __DIR__ . '/../../NFeConfig.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use NFePHP\NFe\Tools;

header('Content-Type: application/json');

try {
    // 1. CARREGAR CONFIGURAÇÃO
    $config = new NFeConfig();
    
    // Validar configuração
    $validation = $config->validate();
    if (!$validation['valid']) {
        http_response_code(500);
        die(json_encode([
            'erro' => 'Configuração de NFe inválida',
            'detalhes' => $validation['errors'],
            'ambiente' => $config->getEnvironment(),
        ]));
    }
    
    // Log para auditoria
    error_log("[NFe] Usando ambiente: " . $config->getEnvironmentName());
    error_log("[NFe] CNPJ: " . $config->getCnpj());
    error_log("[NFe] URL: " . $config->getServiceUrl('authorization'));
    
    // 2. VERIFICAR AMBIENTE (aviso se está em produção)    
    if ($config->isProduction()) {
        error_log("[⚠️ ATENÇÃO] Operação em PRODUÇÃO");
        error_log("[📋] Certificado: " . $config->getCertificatePath());
        error_log("[💰] CNPJ Real: " . $config->getCnpj());
        
        // Pode adicionar checagens extras aqui
        // - Executar apenas em horários comerciais
        // - Exigir autenticação especial
        // - Limitar frequência de emissão
    } else {
        error_log("[✅ SEGURO] Operação em HOMOLOGAÇÃO - Testes");
    }
    
    // 3. RECEBER DADOS DO CLIENTE    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        die(json_encode(['erro' => 'Dados inválidos']));
    }
    
    // 4. VALIDAR DADOS DE SÉRIE    
    $serie = $data['serie'] ?? null;
    $numero = $data['numero'] ?? null;
    
    // IMPORTANTE: Validar série conforme ambiente
    if ($config->isHomogacao()) {
        // Em homologação, usar série 900-999
        if ($serie < 900 || $serie > 999) {
            http_response_code(400);
            die(json_encode([
                'erro' => 'Série inválida para homologação',
                'mensagem' => 'Use série 900-999 para testes. Sua série: ' . $serie,
                'ambiente' => 'homologacao',
            ]));
        }
    } else {
        // Em produção, usar série real (não 900-999)
        if ($serie >= 900 && $serie <= 999) {
            http_response_code(400);
            die(json_encode([
                'erro' => 'Série de teste em ambiente de PRODUÇÃO',
                'mensagem' => 'Você está em PRODUÇÃO. Use série real, não 900-999',
                'ambiente' => 'producao',
            ]));
        }
    }
    
    // 5. CRIAR FERRAMENTAS NFE
    $settings = [
        'atualizacao' => date('Y-m-d H:i:s'),
        'tpAmb' => $config->getAmbientCode(),  // 1 ou 2
        'tpEmis' => 1,
        'razaosocial' => 'SUA RAZÃO SOCIAL',
        'siglaUF' => 'SP',
        'CNPJ' => str_replace(['.', '/'], '', $config->getCnpj()),
        'schemes' => 'PFe',
        'archive' => null,
        'certificadoNumber' => null,
        'cacheDir' => sys_get_temp_dir(),
        'proxyIp' => null,
        'proxyPort' => null,
        'proxyUser' => null,
        'proxyPass' => null,
        'pathCerts' => dirname($config->getCertificatePath()),
        'certname' => basename($config->getCertificatePath()),
        'certpass' => $config->getCertificatePassword(),
        'assinantes' => [],
    ];
    
    $tools = new Tools(json_encode($settings));
    
    // 6. GERAR XML (aqui você teria seu código de geração XML)
    // Exemplo mínimo (VOCÊ deve implementar de verdade)
    $xml = gerarXMLNFe(
        $config,
        $data['numero'],
        $data['serie'],
        $data['cliente'],
        $data['itens']
    );
    
    // 7. ASSINAR XML
    $xmlAssinado = $tools->assinaXML($xml, 'NFe');
    error_log("[✅] XML Assinado");

    // 8. ENVIAR PARA RECEITA FEDERAL
    $response = $tools->sefazEnviaNFe($xmlAssinado);
    // Parsear resposta
    $dom = new DOMDocument();
    $dom->loadXML($response);
    
    // Extrair informações
    $cStat = $dom->getElementsByTagName('cStat')->item(0)->nodeValue ?? null;
    $xMotivo = $dom->getElementsByTagName('xMotivo')->item(0)->nodeValue ?? null;
    $protNFe = $dom->getElementsByTagName('protNFe')->item(0)->nodeValue ?? null;
    
    // 9. RETORNAR RESULTADO
    http_response_code(200);
    echo json_encode([
        'sucesso' => $cStat == '100',
        'status' => $cStat,
        'mensagem' => $xMotivo,
        'protocoloNFe' => $protNFe,
        'ambiente' => $config->getEnvironmentName(),
        'serie' => $serie,
        'numero' => $numero,
        'cnpj' => $config->getCnpj(),
        'aviso' => $config->isProduction() ? 
            '⚠️ PRODUÇÃO: Esta nota tem VALOR FISCAL' : 
            '✅ HOMOLOGAÇÃO: Esta nota é apenas para testes',
    ]);

} catch (Exception $e) {
    error_log("[❌ ERRO] " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'erro' => $e->getMessage(),
        'ambiente' => isset($config) ? $config->getEnvironmentName() : 'desconhecido',
        'debug' => $_ENV['DEBUG'] ?? false,
    ]);
}

/**
 * FUNÇÃO AUXILIAR: Gerar XML da NFe
 * 
 * ESTA É UMA FUNÇÃO STUB - VOCÊ DEVE IMPLEMENTAR COMPLETAMENTE
 */
function gerarXMLNFe($config, $numero, $serie, $cliente, $itens) {
    // AQUI VOCÊ implEMENTA A LÓGICA
    // Usando campos de cliente e itens para construir XML válido
    
    return <<<XML
<?xml version="1.0"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe35240901234567000102650010{$serie:03d}{$numero:08d}00000000000000000000000000" versao="4.00">
        <ide>
            <cUF>35</cUF>
            <natOp>VENDA</natOp>
            <mod>55</mod>
            <serie>$serie</serie>
            <nNF>$numero</nNF>
            <dhEmi>{$config->getEnvironment() == 'homologacao' ? '2024-09-23T10:30:00-03:00' : date('Y-m-d\TH:i:sP')}</dhEmi>
            <tpNF>1</tpNF>
            <tpAmb>{$config->getAmbientCode()}</tpAmb>
            <procEmi>0</procEmi>
            <verProc>1.0</verProc>
        </ide>
        <emit>
            <CNPJ>{$config->getCnpj()}</CNPJ>
        </emit>
        <dest>
            <!-- Dados do cliente -->
        </dest>
        <det nItem="1">
            <!-- Itens -->
        </det>
        <total>
            <!-- Totais -->
        </total>
        <transp>
            <modFrete>9</modFrete>
        </transp>
    </infNFe>
</NFe>
XML;
}

/**
 * MÉTODO PARA MUDAR DE AMBIENTE
 * Em sua aplicação, você pode fazer assim:

 *   if ($_ENV['AMBIENTE'] == 'teste') {
 *       putenv('NFE_ENVIRONMENT=homologacao');
 *   } else {
 *       putenv('NFE_ENVIRONMENT=producao');
 *   }
 
 *   // Agora toda aplicação usa ambiente correto
 *   // SEM ALTERAR uma única linha de código!