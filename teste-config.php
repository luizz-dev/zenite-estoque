<?php
require_once __DIR__ . '/NFeConfig.php';
$config = new NFeConfig();
$v = $config->validate();
print_r($v);