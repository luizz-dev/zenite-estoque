<?php
require_once __DIR__ . '/nfe/NFeConfig.php';
$config = new NFeConfig();
$v = $config->validate();
print_r($v);