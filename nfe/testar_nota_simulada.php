<?php
require_once dirname(__DIR__) . '/vendor/autoload.php';
require_once __DIR__ . '/NFeConfig.php';
require_once __DIR__ . '/NFeXmlBuilder.php';

$config = new NFeConfig();
$emitente = [
    'CNPJ' => '11222333000181',
    'xNome' => 'MODA AURORA DEMO LTDA',
    'IE' => '114857230117',
    'CRT' => '1',
    'endereco' => [
        'xLgr' => 'Rua das Flores', 'nro' => '123', 'xBairro' => 'Centro',
        'cMun' => '3550308', 'xMun' => 'Sao Paulo', 'UF' => 'SP', 'CEP' => '01310100',
    ],
];
$cliente = [
    'CNPJ' => '12345678000195',
    'xNome' => 'CLIENTE TESTE LTDA',
    'endereco' => [
        'xLgr' => 'Avenida Paulista', 'nro' => '1000', 'xBairro' => 'Bela Vista',
        'cMun' => '3550308', 'xMun' => 'Sao Paulo', 'UF' => 'SP', 'CEP' => '01310100',
    ],
];
$itens = [[
    'cProd' => 'VST-0021', 'xProd' => 'Vestido Midi Estampado',
    'NCM' => '61044200', 'CFOP' => '5102', 'uCom' => 'UN',
    'qCom' => '2', 'vUnCom' => '129.90',
]];

$xml = gerarXMLNFe($config, 2301, 900, $emitente, $cliente, $itens);

$caminho = $config->getCertificatePath();
if ($caminho !== '' && is_file($caminho)) {
    $certificado = NFePHP\Common\Certificate::readPfx(file_get_contents($caminho), $config->getCertificatePassword());
    $toolsConfig = [
        'atualizacao' => date('Y-m-d H:i:s'), 'tpAmb' => $config->getAmbientCode(),
        'razaosocial' => 'MODA AURORA DEMO LTDA', 'cnpj' => '11222333000181',
        'siglaUF' => 'SP', 'schemes' => nfeSchema(), 'versao' => '4.00',
    ];
    $tools = new NFePHP\NFe\Tools(json_encode($toolsConfig), $certificado);
    $tools->model(55);
    $xml = $tools->signNFe($xml);
}

$validacao = nfeValidarXml($xml);

file_put_contents(__DIR__ . '/storage/nfe_teste_2301.xml', $xml);
echo json_encode(['validacao' => $validacao, 'arquivo' => __DIR__ . '/storage/nfe_teste_2301.xml'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), PHP_EOL;
