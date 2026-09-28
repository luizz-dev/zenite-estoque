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
    if ($config->isStaging()) {
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
    
    // 6. GERAR XML
    // $data['emitente'] precisa vir preenchido pelo chamador (dados fiscais
    // da Empresa cadastrada no seu banco Prisma) - ver comentário no topo.
    if (empty($data['emitente'])) {
        http_response_code(400);
        die(json_encode(['erro' => 'Dados do emitente (empresa) não informados']));
    }

    $xml = gerarXMLNFe(
        $config,
        (int) $data['numero'],
        (int) $data['serie'],
        $data['emitente'],
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
 * FUNÇÃO REAL: Gerar XML da NFe usando NFePHP\NFe\Make
 *
 * Substitui a versão anterior (string manual, com sintaxe PHP inválida e
 * tags <dest>/<det>/<total> vazias). Aqui a estrutura é montada campo a
 * campo com a API oficial da lib, já instalada em vendor/nfephp-org/sped-nfe.
 *
 * PREMISSA assumida para o piloto: contribuinte do Simples Nacional / MEI,
 * sem ICMS destacado -> CSOSN 102 (tributação simples, sem permissão de
 * crédito). Se seu regime for diferente, troque o bloco tagICMSSN.
 *
 * $config    : instância de NFeConfig já carregada
 * $numero    : número sequencial da nota (int)
 * $serie     : série (900-999 em homologação, já validado antes de chamar)
 * $emitente  : array ['CNPJ'=>, 'xNome'=>, 'IE'=>, 'CRT'=>, 'endereco'=>[...]]
 * $cliente   : array ['CNPJ'=>|'CPF'=>, 'xNome'=>, 'endereco'=>[...]] (xNome
 *              é sobrescrito automaticamente pela lib quando tpAmb=2)
 * $itens     : array de ['cProd','xProd','NCM','CFOP','uCom','qCom','vUnCom']
 */
function gerarXMLNFe(NFeConfig $config, int $numero, int $serie, array $emitente, array $cliente, array $itens): string
{
    $make = new \NFePHP\NFe\Make();

    $tpAmb = $config->getAmbientCode();
    $cUF = \NFePHP\Common\UFList::getCodeByUF($emitente['endereco']['UF']);

    // --- infNFe (raiz) ---
    $std = new stdClass();
    $std->versao = '4.00';
    // Id fica vazio de propósito: a lib calcula a chave de acesso em montaNFe()
    $make->taginfNFe($std);

    // --- ide ---
    $std = new stdClass();
    $std->cUF = $cUF;
    $std->natOp = 'VENDA DE MERCADORIA';
    $std->mod = 55;
    $std->serie = $serie;
    $std->nNF = $numero;
    $std->tpNF = 1;      // 1 = saída
    $std->idDest = 1;    // 1 = operação interna (mesmo estado)
    $std->cMunFG = $emitente['endereco']['cMun'];
    $std->tpImp = 1;     // DANFE retrato
    $std->tpEmis = 1;    // emissão normal
    $std->tpAmb = $tpAmb;
    $std->finNFe = 1;    // NFe normal
    $std->indFinal = 1;  // consumidor final
    $std->indPres = 1;   // operação presencial
    $std->procEmi = 0;
    $std->verProc = 'ZeniteEstoque_1.0';
    $make->tagide($std);

    // --- emit ---
    $std = new stdClass();
    $std->CNPJ = preg_replace('/\D/', '', $emitente['CNPJ']);
    $std->xNome = $emitente['xNome'];
    $std->IE = $emitente['IE'];
    $std->CRT = $emitente['CRT']; // 1 = Simples Nacional
    $make->tagEmit($std);

    $std = new stdClass();
    $std->xLgr = $emitente['endereco']['xLgr'];
    $std->nro = $emitente['endereco']['nro'];
    $std->xBairro = $emitente['endereco']['xBairro'];
    $std->cMun = $emitente['endereco']['cMun'];
    $std->xMun = $emitente['endereco']['xMun'];
    $std->UF = $emitente['endereco']['UF'];
    $std->CEP = preg_replace('/\D/', '', $emitente['endereco']['CEP']);
    $std->cPais = 1058;
    $std->xPais = 'BRASIL';
    $make->tagenderEmit($std);

    // --- dest ---
    // Atenção: NÃO é preciso forçar manualmente o texto de homologação em
    // xNome — a própria lib troca para "NF-E EMITIDA EM AMBIENTE DE
    // HOMOLOGACAO - SEM VALOR FISCAL" sozinha quando tpAmb = 2.
    $std = new stdClass();
    if (!empty($cliente['CNPJ'])) {
        $std->CNPJ = preg_replace('/\D/', '', $cliente['CNPJ']);
    } else {
        $std->CPF = preg_replace('/\D/', '', $cliente['CPF']);
    }
    $std->xNome = $cliente['xNome'];
    $std->indIEDest = 9; // 9 = não contribuinte
    $make->tagdest($std);

    if (!empty($cliente['endereco'])) {
        $std = new stdClass();
        $std->xLgr = $cliente['endereco']['xLgr'];
        $std->nro = $cliente['endereco']['nro'];
        $std->xBairro = $cliente['endereco']['xBairro'];
        $std->cMun = $cliente['endereco']['cMun'];
        $std->xMun = $cliente['endereco']['xMun'];
        $std->UF = $cliente['endereco']['UF'];
        $std->CEP = preg_replace('/\D/', '', $cliente['endereco']['CEP']);
        $std->cPais = 1058;
        $std->xPais = 'BRASIL';
        $make->tagenderDest($std);
    }

    // --- itens (det / prod / imposto / ICMSSN) ---
    $vProdTotal = 0.0;
    foreach ($itens as $i => $item) {
        $nItem = $i + 1;
        $vProd = round($item['qCom'] * $item['vUnCom'], 2);
        $vProdTotal += $vProd;

        $std = new stdClass();
        $std->item = $nItem;
        $std->cProd = $item['cProd'];
        $std->cEAN = 'SEM GTIN';
        $std->xProd = $item['xProd'];
        $std->NCM = $item['NCM'];
        $std->CFOP = $item['CFOP']; // ex: 5102 = venda de mercadoria dentro do estado
        $std->uCom = $item['uCom'];
        $std->qCom = $item['qCom'];
        $std->vUnCom = $item['vUnCom'];
        $std->vProd = $vProd;
        $std->cEANTrib = 'SEM GTIN';
        $std->uTrib = $item['uCom'];
        $std->qTrib = $item['qCom'];
        $std->vUnTrib = $item['vUnCom'];
        $std->indTot = 1;
        $make->tagprod($std);

        $std = new stdClass();
        $std->item = $nItem;
        $std->orig = 0;     // 0 = nacional
        $std->CSOSN = '102';
        $make->tagICMSSN($std);
    }

    // --- total ---
    $std = new stdClass();
    $std->vBC = 0;
    $std->vICMS = 0;
    $std->vProd = $vProdTotal;
    $std->vNF = $vProdTotal;
    $make->tagICMSTot($std);

    // --- transp ---
    $std = new stdClass();
    $std->modFrete = 9; // 9 = sem transporte
    $make->tagtransp($std);

    $xml = $make->montaNFe();

    if (!empty($make->getErrors())) {
        throw new Exception('Erros ao montar XML da NFe: ' . implode(' | ', $make->getErrors()));
    }

    return $xml;
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