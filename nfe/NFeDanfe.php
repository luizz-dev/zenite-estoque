<?php
use NFePHP\DA\NFe\Danfe;

function gerarDanfePdf(string $xml): string
{
    if (trim($xml) === '') {
        throw new InvalidArgumentException('XML da nota vazio.');
    }

    $danfe = new Danfe($xml);
    $danfe->debugMode(false);
    return $danfe->render();
}