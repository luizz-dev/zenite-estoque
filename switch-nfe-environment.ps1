# ═══════════════════════════════════════════════════════════════════════════
# Script PowerShell para Trocar Ambiente de NFe (Windows)
# ═══════════════════════════════════════════════════════════════════════════
#
# PROPÓSITO: Facilitar troca entre homologação e produção em Windows
# 
# USO:
#   .\switch-nfe-environment.ps1 -Environment homologacao
#   .\switch-nfe-environment.ps1 -Environment producao
#   .\switch-nfe-environment.ps1 -Status
#
# INSTALAÇÃO:
#   1. Copie este arquivo para a raiz do projeto
#   2. Execute: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#   3. Pronto! Agora pode usar
#
# ═══════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("homologacao", "producao", "status", "list")]
    [string]$Environment = "status"
)

# Funções de output com cores
function Write-Header {
    param([string]$message)
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host "  $message" -ForegroundColor Blue
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Blue
}

function Write-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$message)
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

# Diretório do projeto
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ═══════════════════════════════════════════════════════════════════════════
# Funções Principais
# ═══════════════════════════════════════════════════════════════════════════

function Validate-Environment {
    param([string]$env)
    
    Write-Info "Validando configuração de $env..."
    
    $envFile = Join-Path $ProjectDir ".env.$env"
    
    if (-not (Test-Path $envFile)) {
        Write-Error "Arquivo não encontrado: $envFile"
        Write-Host "Execute: copy .env.example .env.$env" -ForegroundColor Yellow
        return $false
    }
    
    return $true
}

function Switch-ToEnvironment {
    param([string]$env)
    
    Write-Header "Trocando para Ambiente: $env"
    
    if (-not (Validate-Environment $env)) {
        return
    }
    
    $sourceEnvFile = Join-Path $ProjectDir ".env.$env"
    $targetEnvFile = Join-Path $ProjectDir ".env.local"
    
    # Copiar arquivo
    Copy-Item -Path $sourceEnvFile -Destination $targetEnvFile -Force
    
    Write-Success "Ambiente alterado para: $env"
    
    # Ler configurações
    $envContent = Get-Content $sourceEnvFile
    $cnpj = $envContent | Select-String "^NFE_CNPJ=" | ForEach-Object { $_.Line.Split('=')[1].Trim() }
    $certPath = $envContent | Select-String "^NFE_CERTIFICATE_PATH=" | ForEach-Object { $_.Line.Split('=')[1].Trim() }
    
    if ($env -eq "producao") {
        Write-Warning "VOCÊ ESTÁ EM PRODUÇÃO!"
        Write-Warning "Certificado: $certPath"
        Write-Warning "CNPJ: $cnpj"
    } else {
        Write-Success "Ambiente seguro de TESTES ativado"
    }
    
    # Definir variável de ambiente
    [Environment]::SetEnvironmentVariable("NFE_ENVIRONMENT", $env, "Process")
    Write-Info "Variável `$env:NFE_ENVIRONMENT=$env definida (sessão atual)"
    
    # Sugestão para permanente
    Write-Info "Para tornar permanente, execute como Admin:"
    Write-Host "  [Environment]::SetEnvironmentVariable('NFE_ENVIRONMENT', '$env', 'User')" -ForegroundColor Gray
}

function Show-Status {
    Write-Header "Status Atual do Ambiente NFe"
    
    $envLocalFile = Join-Path $ProjectDir ".env.local"
    
    if (Test-Path $envLocalFile) {
        $envContent = Get-Content $envLocalFile
        $currentEnv = $envContent | Select-String "^NFE_ENVIRONMENT=" | ForEach-Object { $_.Line.Split('=')[1].Trim() }
        
        if ($currentEnv) {
            Write-Success "Ambiente ativo: $currentEnv"
            
            Write-Host ""
            Write-Info "Configurações atuais:"
            
            $cnpj = $envContent | Select-String "^NFE_CNPJ=" | ForEach-Object { $_.Line.Split('=')[1].Trim() }
            $certPath = $envContent | Select-String "^NFE_CERTIFICATE_PATH=" | ForEach-Object { $_.Line.Split('=')[1].Trim() }
            
            Write-Host "  CNPJ: $cnpj"
            Write-Host "  Certificado: $certPath"
            
            if ($currentEnv -eq "producao") {
                Write-Warning "⚠️  ATENÇÃO: Você está em PRODUÇÃO"
            } else {
                Write-Success "✅ Você está em TESTES (seguro)"
            }
        } else {
            Write-Warning "Nenhum ambiente configurado"
        }
    } else {
        Write-Error "Arquivo .env.local não encontrado"
        Write-Host "Execute: .\switch-nfe-environment.ps1 -Environment homologacao" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Info "Ambientes disponíveis:"
    
    if (Test-Path (Join-Path $ProjectDir ".env.homologacao")) {
        Write-Host "  ✓ homologacao" -ForegroundColor Green
    } else {
        Write-Host "  ✗ homologacao (não encontrado)" -ForegroundColor Red
    }
    
    if (Test-Path (Join-Path $ProjectDir ".env.producao")) {
        Write-Host "  ✓ producao" -ForegroundColor Green
    } else {
        Write-Host "  ✗ producao (não encontrado)" -ForegroundColor Red
    }
}

function Show-Help {
    Write-Header "Ambientes Disponíveis"
    
    Write-Host "Homologação (TESTES):"
    Write-Host "  .\switch-nfe-environment.ps1 -Environment homologacao" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Produção (REAL):"
    Write-Host "  .\switch-nfe-environment.ps1 -Environment producao" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Status:"
    Write-Host "  .\switch-nfe-environment.ps1 -Status" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Listar ambientes:"
    Write-Host "  .\switch-nfe-environment.ps1 -List" -ForegroundColor Cyan
}

# ═══════════════════════════════════════════════════════════════════════════
# Executar
# ═══════════════════════════════════════════════════════════════════════════

switch ($Environment) {
    "homologacao" {
        Switch-ToEnvironment "homologacao"
    }
    "producao" {
        Write-Warning "ATENÇÃO: Você será movido para PRODUÇÃO!"
        Write-Warning "Qualquer erro aqui pode resultar em problemas legais."
        Write-Host ""
        $confirm = Read-Host "Digite 'sim' para confirmar"
        
        if ($confirm -eq "sim") {
            Switch-ToEnvironment "producao"
        } else {
            Write-Error "Operação cancelada"
            exit 1
        }
    }
    "status" {
        Show-Status
    }
    "list" {
        Show-Help
    }
    default {
        Show-Help
    }
}
