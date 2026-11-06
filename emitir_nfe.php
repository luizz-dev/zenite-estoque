<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/NFeConfig.php';
require_once __DIR__ . '/NFeXmlBuilder.php';

function responderJson(array $payload): void
{
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit(0);
}

try {
    $raw = $argv[1] ?? '{}';
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        responderJson([
            'sucesso' => false,
            'status' => 'erro',
            'mensagem' => 'Payload de NF-e inválido.',
            'motivoRejeicao' => 'Payload de NF-e inválido.',
        ]);
    }

    $config = new NFeConfig();
    $validacao = $config->validate();

    if (!$validacao['valid']) {
        responderJson([
            'sucesso' => false,
            'status' => 'erro',
            'mensagem' => implode('; ', $validacao['errors']),
            'motivoRejeicao' => implode('; ', $validacao['errors']),
        ]);
    }

    $numero = (int) ($data['numero'] ?? 1);
    $serie = (int) ($data['serie'] ?? 900);
    $emitente = $data['emitente'] ?? [];
    $cliente = $data['cliente'] ?? [];
    $itens = $data['itens'] ?? [];

    if (empty($emitente) || empty($cliente) || empty($itens)) {
        responderJson([
            'sucesso' => false,
            'status' => 'erro',
            'mensagem' => 'Faltam dados do emitente, cliente ou itens para gerar a NF-e.',
            'motivoRejeicao' => 'Faltam dados do emitente, cliente ou itens para gerar a NF-e.',
        ]);
    }

    $xml = gerarXMLNFe($config, $numero, $serie, $emitente, $cliente, $itens);

    $certPath = $config->getCertificatePath();
    $certName = basename($certPath);
    $settings = [
        'atualizacao' => date('Y-m-d H:i:s'),
        'tpAmb' => $config->getAmbientCode(),
        'tpEmis' => 1,
        'razaosocial' => $emitente['xNome'] ?? 'Empresa',
        'siglaUF' => $emitente['endereco']['UF'] ?? 'SP',
        'CNPJ' => preg_replace('/\D/', '', $emitente['CNPJ'] ?? $config->getCnpj()),
        'schemes' => 'PFe',
        'archive' => null,
        'certificadoNumber' => null,
        'cacheDir' => sys_get_temp_dir(),
        'proxyIp' => null,
        'proxyPort' => null,
        'proxyUser' => null,
        'proxyPass' => null,
        'pathCerts' => dirname($certPath ?: __DIR__),
        'certname' => $certName ?: 'certificado.pfx',
        'certpass' => $config->getCertificatePassword(),
        'assinantes' => [],
    ];

    $tools = new \NFePHP\NFe\Tools(json_encode($settings));
    $xmlAssinado = $tools->assinaXML($xml, 'NFe');
    $resposta = $tools->sefazEnviaNFe($xmlAssinado);

    $dom = new DOMDocument();
    $dom->loadXML($resposta);

    $cStat = $dom->getElementsByTagName('cStat')->item(0)?->nodeValue ?? 'erro';
    $xMotivo = $dom->getElementsByTagName('xMotivo')->item(0)?->nodeValue ?? 'Erro desconhecido ao emitir a NF-e.';
    $protNFe = $dom->getElementsByTagName('nProt')->item(0)?->nodeValue ?? null;

    $sucesso = ($cStat === '100');

    responderJson([
        'sucesso' => $sucesso,
        'status' => $cStat,
        'mensagem' => $sucesso ? 'NF-e autorizada com sucesso.' : $xMotivo,
        'motivoRejeicao' => $sucesso ? null : $xMotivo,
        'protocoloNFe' => $protNFe,
        'ambiente' => $config->getEnvironmentName(),
        'detalhes' => [
            'serie' => $serie,
            'numero' => $numero,
            'cnpj' => $config->getCnpj(),
        ],
    ]);
} catch (Throwable $e) {
    responderJson([
        'sucesso' => false,
        'status' => 'erro',
        'mensagem' => $e->getMessage(),
        'motivoRejeicao' => $e->getMessage(),
    ]);
}
