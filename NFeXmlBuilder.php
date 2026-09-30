<?php
/**
 * NFeXmlBuilder
 *
 * Monta o XML da NF-e (NFePHP\NFe\Make) a partir de dados já validados.
 * Isolado de propósito do endpoint HTTP: não faz header(), não mata o
 * script, não depende de request — só recebe dados e devolve XML (ou
 * lança Exception). Isso permite testar a montagem sem certificado, sem
 * rede, e sem passar pelo fluxo completo de emissão.
 *
 * USO:
 *   require_once __DIR__ . '/vendor/autoload.php';
 *   require_once __DIR__ . '/NFeConfig.php';
 *   require_once __DIR__ . '/NFeXmlBuilder.php';
 *
 *   $config = new NFeConfig();
 *   $xml = gerarXMLNFe($config, 1, 900, $emitente, $cliente, $itens);
 */

/**
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

    //  infNFe (raiz) 
    $std = new stdClass();
    $std->versao = '4.00';
    // Id fica vazio de propósito: a lib calcula a chave de acesso em montaNFe()
    $make->taginfNFe($std);

    //  ide 
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

    //  emit 
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

    // dest
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

    // itens (det / prod / imposto / ICMSSN)
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

    // total
    $std = new stdClass();
    $std->vBC = 0;
    $std->vICMS = 0;
    $std->vProd = $vProdTotal;
    $std->vNF = $vProdTotal;
    $make->tagICMSTot($std);

    // transp
    $std = new stdClass();
    $std->modFrete = 9; // 9 = sem transporte
    $make->tagtransp($std);

    // pag (forma de pagamento)
    // Obrigatório em toda NFe desde a NT2016_002. Aqui assumimos dinheiro à
    // vista (tPag=01) pelo valor total da nota. Se seu sistema tiver outras
    // formas (cartão, pix), troque tPag e, se cartão, preencha CNPJ da
    // credenciadora/tBand/cAut também.
    $std = new stdClass();
    $std->vTroco = 0;
    $make->tagpag($std);

    $std = new stdClass();
    $std->indPag = 0;    // 0 = pagamento à vista
    $std->tPag = '01';   // 01 = dinheiro
    $std->vPag = $vProdTotal;
    $make->tagdetPag($std);

    $xml = $make->montaNFe();

    if (!empty($make->getErrors())) {
        throw new Exception('Erros ao montar XML da NFe: ' . implode(' | ', $make->getErrors()));
    }

    return $xml;
}