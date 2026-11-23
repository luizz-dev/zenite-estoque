<?php
/**
 * Serviço HTTP de NF-e. Execute na raiz do projeto:
 * php -S 127.0.0.1:8081 nfe/nfe-service.php
 */

require_once dirname(__DIR__) . '/vendor/autoload.php';
require_once __DIR__ . '/NFeConfig.php';
require_once __DIR__ . '/NFeEmissor.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function responder(int $http, array $corpo): void
{
    http_response_code($http);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$caminho = rtrim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/') ?: '/';

try {
    $config = new NFeConfig();
    $emissor = new NFeEmissor($config);

    if ($metodo === 'GET' && $caminho === '/saude') {
        responder(200, ['ok' => true, 'modo' => $emissor->modo(), 'ambiente' => $emissor->ambiente()]);
    }

    $esperado = (string) getenv('NFE_SERVICE_TOKEN');
    if (strlen($esperado) < 16) {
        responder(500, ['erro' => 'NFE_SERVICE_TOKEN não configurado (mínimo 16 caracteres).']);
    }
    $recebido = (string) ($_SERVER['HTTP_X_SERVICE_TOKEN'] ?? '');
    if (!hash_equals($esperado, $recebido)) {
        responder(401, ['erro' => 'Token de serviço inválido.']);
    }

    if ($metodo !== 'POST' || !in_array($caminho, ['/emitir', '/consultar'], true)) {
        responder(404, ['erro' => 'Rota não encontrada.']);
    }

    $bruto = file_get_contents('php://input');
    if (strlen($bruto) > 1024 * 1024) {
        responder(413, ['erro' => 'Corpo da requisição grande demais.']);
    }
    $dados = json_decode($bruto, true);
    if (!is_array($dados)) {
        responder(400, ['erro' => 'JSON inválido.']);
    }

    if ($caminho === '/emitir') {
        responder(200, $emissor->emitir($dados));
    }
    responder(200, $emissor->consultar((string) ($dados['chave'] ?? '')));

} catch (InvalidArgumentException $e) {
    responder(422, ['status' => 'rejeitada', 'cStat' => '', 'motivo' => 'Validação local: ' . $e->getMessage(), 'ambiente' => isset($emissor) ? $emissor->ambiente() : 'desconhecido']);
} catch (\Throwable $e) {
    error_log('[nfe-service] ' . get_class($e) . ': ' . $e->getMessage());
    responder(500, ['erro' => $e->getMessage()]);
}
