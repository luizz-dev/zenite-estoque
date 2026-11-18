<?php
/**
 * NFeEmissor — orquestra a emissão de uma NF-e.
 *
 * Dois modos (variável NFE_MODE):
 *   simulado (padrão) — monta o XML de verdade e valida contra o XSD, mas NÃO
 *                       assina nem fala com a SEFAZ. Responde "autorizada" com
 *                       protocolo falso. Não precisa de certificado.
 *   real              — assina com o certificado A1 e envia à SEFAZ
 *                       (homologação ou produção, conforme NFE_ENVIRONMENT).
 *
 * CONTRATO COM O CHAMADOR (Next.js):
 *   - Falhas ANTES de enviar (dados inválidos, config errada) → exceção
 *     (InvalidArgumentException / RuntimeException). Nada foi enviado.
 *   - Falha de comunicação DEPOIS de tentar enviar → status "pendente",
 *     com a chave de acesso, para consultar depois (nunca reenviar às cegas:
 *     reenviar uma nota que a SEFAZ já recebeu gera rejeição 539).
 */

require_once __DIR__ . '/NFeConfig.php';
require_once __DIR__ . '/NFeXmlBuilder.php';

use NFePHP\Common\Certificate;
use NFePHP\Common\Soap\SoapCurl;
use NFePHP\Common\UFList;
use NFePHP\NFe\Common\Standardize;
use NFePHP\NFe\Complements;
use NFePHP\NFe\Tools;

class NFeEmissor
{
    private NFeConfig $config;
    private string $modo;

    public function __construct(NFeConfig $config)
    {
        $this->config = $config;
        $modo = strtolower(trim(getenv('NFE_MODE') ?: 'simulado'));
        if (!in_array($modo, ['simulado', 'real'], true)) {
            throw new RuntimeException("NFE_MODE inválido ('$modo'). Use 'simulado' ou 'real'.");
        }
        $this->modo = $modo;

        if ($modo === 'real' && $config->isProduction() && getenv('NFE_PERMITIR_PRODUCAO') !== '1') {
            throw new RuntimeException('Ambiente de PRODUÇÃO bloqueado. Defina NFE_PERMITIR_PRODUCAO=1 se tiver certeza.');
        }
    }

    public function modo(): string
    {
        return $this->modo;
    }

    public function ambiente(): string
    {
        if ($this->modo === 'simulado') {
            return 'simulado';
        }
        return $this->config->isProduction() ? 'producao' : 'homologacao';
    }

    public function emitir(array $d): array
    {
        foreach (['numero', 'serie', 'emitente', 'cliente', 'itens'] as $campo) {
            if (!isset($d[$campo])) {
                throw new InvalidArgumentException("Campo '$campo' ausente no pedido de emissão.");
            }
        }
        if (isset($d['ambienteEsperado']) && $d['ambienteEsperado'] !== $this->ambiente()) {
            throw new RuntimeException(sprintf(
                "Ambiente divergente: o app espera '%s' mas o serviço fiscal está em '%s'. Nada foi enviado.",
                $d['ambienteEsperado'],
                $this->ambiente()
            ));
        }

        $numero = (int) $d['numero'];
        $serie = (int) $d['serie'];
        $opcoes = [
            'csosn' => $d['csosn'] ?? '102',
            'formaPagamento' => $d['formaPagamento'] ?? '01',
        ];
        foreach (['pCredSN', 'dhEmi', 'cNF'] as $k) {
            if (isset($d[$k])) {
                $opcoes[$k] = $d[$k];
            }
        }

        $xml = gerarXMLNFe($this->config, $numero, $serie, $d['emitente'], $d['cliente'], $d['itens'], $opcoes);
        $chave = nfeChaveDoXml($xml);

        return $this->modo === 'simulado'
            ? $this->emitirSimulado($xml, $chave, $d['simulacao'] ?? null)
            : $this->emitirReal($xml, $chave, $d['emitente'], $numero);
    }

    private function emitirSimulado(string $xml, ?string $chave, ?string $simulacao): array
    {
        $v = nfeValidarXml($xml);
        if (!$v['ok']) {
            throw new InvalidArgumentException('XML fora do schema: ' . implode(' | ', $v['erros']));
        }

        $base = ['chaveAcesso' => $chave, 'ambiente' => 'simulado', 'xmlAutorizado' => null];

        if ($simulacao === 'rejeicao') {
            return array_merge($base, ['status' => 'rejeitada', 'cStat' => '539', 'motivo' => 'Rejeição 539 (simulada): duplicidade de NF-e.']);
        }
        if ($simulacao === 'pendente') {
            return array_merge($base, ['status' => 'pendente', 'cStat' => '', 'motivo' => 'Sem resposta da SEFAZ (simulado) — consulte depois.']);
        }
        return array_merge($base, [
            'status' => 'autorizada', 'cStat' => '100',
            'motivo' => 'Autorizado o uso da NF-e (SIMULADO — sem valor fiscal).',
            'protocolo' => 'SIM' . str_pad((string) random_int(0, 999999999999), 12, '0', STR_PAD_LEFT),
            'dhAutorizacao' => date('c'), 'xmlAutorizado' => $xml,
        ]);
    }

    private function emitirReal(string $xml, ?string $chave, array $emitente, int $numero): array
    {
        $tools = $this->criarTools(nfeSoDigitos($emitente['CNPJ']), (string) $emitente['endereco']['UF'], (string) $emitente['xNome'], true);

        $assinado = $tools->signNFe($xml);
        $idLote = str_pad((string) $numero, 15, '0', STR_PAD_LEFT);

        try {
            $resposta = $tools->sefazEnviaLote([$assinado], $idLote, 1);
        } catch (\Throwable $e) {
            error_log('[NFe] falha de comunicação no envio: ' . $e->getMessage());
            return ['status' => 'pendente', 'cStat' => '', 'motivo' => 'Falha de comunicação com a SEFAZ: ' . $e->getMessage(), 'chaveAcesso' => $chave, 'ambiente' => $this->ambiente(), 'xmlAutorizado' => null];
        }

        try {
            return $this->interpretarEnvio($resposta, $assinado, $chave);
        } catch (\Throwable $e) {
            error_log('[NFe] resposta ilegível: ' . $e->getMessage());
            return ['status' => 'pendente', 'cStat' => '', 'motivo' => 'Resposta da SEFAZ não pôde ser interpretada: ' . $e->getMessage(), 'chaveAcesso' => $chave, 'ambiente' => $this->ambiente(), 'xmlAutorizado' => null];
        }
    }

    private function interpretarEnvio(string $resposta, string $assinado, ?string $chave): array
    {
        $std = (new Standardize())->toStd($resposta);
        $cStatLote = (string) ($std->cStat ?? '');
        $xMotivoLote = (string) ($std->xMotivo ?? '');
        $base = ['chaveAcesso' => $chave, 'ambiente' => $this->ambiente(), 'xmlAutorizado' => null];

        if (in_array($cStatLote, ['103', '105'], true)) {
            return array_merge($base, ['status' => 'pendente', 'cStat' => $cStatLote, 'motivo' => $xMotivoLote]);
        }

        $inf = $std->protNFe->infProt ?? null;
        if ($cStatLote !== '104' || $inf === null) {
            return array_merge($base, ['status' => 'rejeitada', 'cStat' => $cStatLote, 'motivo' => "Rejeição $cStatLote: $xMotivoLote"]);
        }

        $cStat = (string) $inf->cStat;
        $motivo = (string) $inf->xMotivo;
        $base['chaveAcesso'] = (string) ($inf->chNFe ?? $chave);

        if (in_array($cStat, ['100', '150'], true)) {
            return array_merge($base, ['status' => 'autorizada', 'cStat' => $cStat, 'motivo' => $motivo, 'protocolo' => (string) ($inf->nProt ?? ''), 'dhAutorizacao' => (string) ($inf->dhRecbto ?? ''), 'xmlAutorizado' => Complements::toAuthorize($assinado, $resposta)]);
        }
        if (in_array($cStat, ['110', '205', '301', '302'], true)) {
            return array_merge($base, ['status' => 'rejeitada', 'cStat' => $cStat, 'motivo' => "NF-e DENEGADA ($cStat): $motivo"]);
        }
        return array_merge($base, ['status' => 'rejeitada', 'cStat' => $cStat, 'motivo' => "Rejeição $cStat: $motivo"]);
    }

    public function consultar(string $chave): array
    {
        $chave = nfeSoDigitos($chave);
        if (strlen($chave) !== 44) {
            throw new InvalidArgumentException('Chave de acesso deve ter 44 dígitos.');
        }

        if ($this->modo === 'simulado') {
            return ['status' => 'autorizada', 'cStat' => '100', 'motivo' => 'Autorizado o uso da NF-e (SIMULADO).', 'chaveAcesso' => $chave, 'protocolo' => 'SIM' . substr($chave, -12), 'dhAutorizacao' => date('c'), 'ambiente' => 'simulado', 'xmlAutorizado' => null];
        }

        $uf = UFList::getUFByCode((int) substr($chave, 0, 2));
        $tools = $this->criarTools(substr($chave, 6, 14), $uf, 'CONSULTA', false);

        try {
            $resposta = $tools->sefazConsultaChave($chave);
        } catch (\Throwable $e) {
            return ['status' => 'pendente', 'cStat' => '', 'chaveAcesso' => $chave, 'ambiente' => $this->ambiente(), 'motivo' => 'Falha ao consultar a SEFAZ: ' . $e->getMessage(), 'xmlAutorizado' => null];
        }

        $std = (new Standardize())->toStd($resposta);
        $cStat = (string) ($std->cStat ?? '');
        $motivo = (string) ($std->xMotivo ?? '');
        $inf = $std->protNFe->infProt ?? null;
        $base = ['chaveAcesso' => $chave, 'ambiente' => $this->ambiente(), 'xmlAutorizado' => null, 'cStat' => $cStat, 'motivo' => $motivo];

        if (in_array($cStat, ['100', '150'], true)) {
            return array_merge($base, ['status' => 'autorizada', 'protocolo' => (string) ($inf->nProt ?? ''), 'dhAutorizacao' => (string) ($inf->dhRecbto ?? '')]);
        }
        if (in_array($cStat, ['101', '151', '155'], true)) {
            return array_merge($base, ['status' => 'cancelada']);
        }
        if ($cStat === '217') {
            return array_merge($base, ['status' => 'rejeitada', 'motivo' => 'NF-e não consta na base da SEFAZ (217): o envio não chegou. Emita novamente.']);
        }
        if (in_array($cStat, ['110', '205', '301', '302'], true)) {
            return array_merge($base, ['status' => 'rejeitada', 'motivo' => "NF-e DENEGADA ($cStat): $motivo"]);
        }
        return array_merge($base, ['status' => 'pendente']);
    }

    private function criarTools(string $cnpj, string $uf, string $razaoSocial, bool $conferirCnpjDoCertificado): Tools
    {
        $caminho = $this->config->getCertificatePath();
        if ($caminho === '' || !is_file($caminho)) {
            throw new RuntimeException('Certificado não encontrado: confira NFE_CERTIFICATE_PATH.');
        }
        $certificado = Certificate::readPfx(file_get_contents($caminho), $this->config->getCertificatePassword());

        if ($conferirCnpjDoCertificado) {
            $cnpjCert = nfeSoDigitos($certificado->getCnpj());
            if ($cnpjCert !== '' && substr($cnpjCert, 0, 8) !== substr($cnpj, 0, 8)) {
                throw new InvalidArgumentException('CNPJ do emitente difere do CNPJ do certificado digital (a SEFAZ rejeitaria com 213). Nada foi enviado.');
            }
        }

        $config = [
            'atualizacao' => date('Y-m-d H:i:s'),
            'tpAmb' => $this->config->getAmbientCode(),
            'razaosocial' => $razaoSocial,
            'cnpj' => $cnpj,
            'siglaUF' => $uf,
            'schemes' => nfeSchema(),
            'versao' => '4.00',
        ];

        $tools = new Tools(json_encode($config), $certificado);
        $tools->model(55);

        $soap = new SoapCurl($certificado);
        $soap->timeout($this->config->getTimeout());
        $tools->loadSoapClass($soap);

        return $tools;
    }
}
