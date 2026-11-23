<?php
/**
 * Gera um certificado A1 FICTÍCIO (.pfx) para a demonstração do Zênite.
 * Autoassinado: serve para testar upload, leitura e validação.
 * NÃO é aceito pela SEFAZ.
 *
 * Uso (na raiz do projeto):  php gerar_certificado_teste.php
 */

// ---- Configuração (pode mudar à vontade) ----
$razaoSocial = 'MODA AURORA DEMO LTDA';
$cnpj        = '11222333000181';   // CNPJ fictício com dígitos verificadores válidos
$senha       = 'zen123';           // senha de TESTE
$validadeDias = 365;
$pastaSaida  = __DIR__ . '/storage/certificados-teste';
$nomeArquivo = 'certificado_teste_a1.pfx';

// ---- OpenSSL no Windows precisa achar o openssl.cnf ----
$cfg = getenv('OPENSSL_CONF') ?: null;
if (!$cfg) {
    $candidatos = [
        dirname(PHP_BINARY) . '/extras/ssl/openssl.cnf',
        'C:/xampp/php/extras/ssl/openssl.cnf',
        'C:/xampp/apache/conf/openssl.cnf',
        '/etc/ssl/openssl.cnf',
    ];
    foreach ($candidatos as $c) {
        if (is_file($c)) { $cfg = $c; break; }
    }
}
$opts = ['digest_alg' => 'sha256', 'private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA];
if ($cfg) { $opts['config'] = $cfg; }

function falhar(string $msg): never {
    fwrite(STDERR, "ERRO: $msg\n");
    while ($e = openssl_error_string()) { fwrite(STDERR, "  openssl: $e\n"); }
    exit(1);
}

// ---- 1) Chave privada ----
$chave = openssl_pkey_new($opts);
if (!$chave) falhar('não foi possível criar a chave privada (verifique o openssl.cnf).');

// ---- 2) Pedido de certificado (formato do nome: RAZAO:CNPJ, como nos A1 reais) ----
$dn = [
    'countryName'            => 'BR',
    'stateOrProvinceName'    => 'SP',
    'localityName'           => 'Sao Paulo',
    'organizationName'       => 'Zenite Demo (Certificado de Teste)',
    'organizationalUnitName' => 'Uso exclusivo em demonstracao',
    'commonName'             => "$razaoSocial:$cnpj",
];
$csr = openssl_csr_new($dn, $chave, $opts);
if (!$csr) falhar('não foi possível criar o CSR.');

// ---- 3) Autoassina ----
$cert = openssl_csr_sign($csr, null, $chave, $validadeDias, $opts, random_int(1, PHP_INT_MAX));
if (!$cert) falhar('não foi possível assinar o certificado.');

// ---- 4) Empacota em .pfx com senha ----
if (!openssl_pkcs12_export($cert, $pfx, $chave, $senha)) falhar('não foi possível gerar o .pfx.');

if (!is_dir($pastaSaida) && !mkdir($pastaSaida, 0700, true)) falhar("não foi possível criar $pastaSaida");
$destino = $pastaSaida . '/' . $nomeArquivo;
file_put_contents($destino, $pfx);

echo "Certificado gerado em: $destino\n";
echo "Senha de teste: $senha\n\n";

// ---- 5) Confere lendo de volta com o próprio OpenSSL ----
if (!openssl_pkcs12_read($pfx, $lido, $senha)) falhar('o .pfx gerado não abriu com a senha.');
$info = openssl_x509_parse($lido['cert']);
echo "[OpenSSL] Nome ........: " . $info['subject']['CN'] . "\n";
echo "[OpenSSL] Válido até ..: " . date('d/m/Y', $info['validTo_time_t']) . "\n";

// ---- 6) Confere com a NFePHP (se o vendor estiver instalado) ----
$autoload = __DIR__ . '/vendor/autoload.php';
if (is_file($autoload)) {
    require $autoload;
    try {
        $c = NFePHP\Common\Certificate::readPfx($pfx, $senha);
        echo "[NFePHP]  Abriu o certificado com sucesso.\n";
        echo "[NFePHP]  Razão .......: " . $c->getCompanyName() . "\n";
        echo "[NFePHP]  Válido até ..: " . $c->getValidTo()->format('d/m/Y') . "\n";
        echo "[NFePHP]  CNPJ (campo ICP-Brasil): " . ($c->getCnpj() ?: '(vazio - esperado em certificado de teste)') . "\n";
    } catch (Throwable $e) {
        echo "[NFePHP]  Falhou ao ler: " . $e->getMessage() . "\n";
    }
} else {
    echo "[NFePHP]  vendor/autoload.php não encontrado, pulei esta conferência.\n";
}
