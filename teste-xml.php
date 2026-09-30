<?php
/**
 * teste-xml.php
 *
 * Testa a MONTAGEM do XML da NFe sem precisar de certificado nem de rede.
 * Não assina, não envia à SEFAZ — só monta e valida a estrutura contra o
 * schema XSD oficial (já vem dentro do vendor/nfephp-org/sped-nfe/schemes).
 *
 * Isso adianta trabalho real enquanto o certificado digital não chega:
 * se o XML aqui já vier estruturalmente válido, a parte mais arriscada
 * do projeto (montar os dados certos) já está resolvida. Assinatura e
 * envio são só os dois últimos passos, e são mecânicos.
 *
 * RODAR:
 *   php teste-xml.php
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/NFeConfig.php';
require_once __DIR__ . '/NFeXmlBuilder.php';

$config = new NFeConfig();

// --- dados fictícios de teste (troque pelos dados reais da sua empresa depois) ---
$emitente = [
    'CNPJ' => '34028316000102', // CNPJ de teste padrão da SEFAZ, ok p/ homologação
    'xNome' => 'ZENITE ESTOQUE TESTES MEI',
    'IE' => 'ISENTO',
    'CRT' => 1, // 1 = Simples Nacional
    'endereco' => [
        'xLgr' => 'Rua Exemplo',
        'nro' => '100',
        'xBairro' => 'Centro',
        'cMun' => '3550308', // código IBGE de São Paulo/SP
        'xMun' => 'Sao Paulo',
        'UF' => 'SP',
        'CEP' => '01000000',
    ],
];

$cliente = [
    'CPF' => '11111111111', // CPF de teste válido para homologação
    'xNome' => 'CONSUMIDOR TESTE', // será sobrescrito automaticamente em homologação
    'endereco' => null, // opcional, pode omitir
];

$itens = [
    [
        'cProd' => 'SKU-001',
        'xProd' => 'Produto de teste',
        'NCM' => '61091000',
        'CFOP' => '5102',
        'uCom' => 'UN',
        'qCom' => 2,
        'vUnCom' => 29.90,
    ],
];

try {
    $xml = gerarXMLNFe($config, 1, 900, $emitente, $cliente, $itens);

    // salva pra você poder abrir e ler o XML gerado
    file_put_contents(__DIR__ . '/nfe-teste-gerada.xml', $xml);
    echo "✅ XML montado com sucesso. Salvo em nfe-teste-gerada.xml\n\n";

    // --- validação offline contra o schema oficial ---
    $schemaPath = __DIR__ . '/vendor/nfephp-org/sped-nfe/schemes/PL_010_V1.21/nfe_v4.00.xsd';

    if (!file_exists($schemaPath)) {
        echo "⚠️  Schema não encontrado em $schemaPath — ajuste o caminho conforme a\n";
        echo "    pasta que existir dentro de vendor/nfephp-org/sped-nfe/schemes/\n";
        exit;
    }

    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadXML($xml);

    if ($dom->schemaValidate($schemaPath)) {
        echo "✅ XML VÁLIDO conforme o schema oficial da NFe 4.00.\n";
    } else {
        echo "❌ XML com problemas de schema:\n";
        foreach (libxml_get_errors() as $error) {
            echo "  - Linha {$error->line}: " . trim($error->message) . "\n";
        }
        libxml_clear_errors();
    }
} catch (Exception $e) {
    echo "❌ Erro ao montar XML: " . $e->getMessage() . "\n";
}