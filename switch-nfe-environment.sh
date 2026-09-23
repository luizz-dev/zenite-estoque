#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script para Trocar Ambiente de NFe
# ═══════════════════════════════════════════════════════════════════════════
#
# PROPÓSITO: Facilitar troca entre homologação e produção
# 
# USO:
#   ./switch-nfe-environment.sh homologacao
#   ./switch-nfe-environment.sh producao
#   ./switch-nfe-environment.sh status
#
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Sair se algum comando falhar

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ═══════════════════════════════════════════════════════════════════════════
# Funções
# ═══════════════════════════════════════════════════════════════════════════

print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_env_file() {
    local env_file=$1
    if [ ! -f "$env_file" ]; then
        print_error "Arquivo não encontrado: $env_file"
        return 1
    fi
    return 0
}

validate_environment() {
    local env=$1
    
    print_info "Validando configuração de $env..."
    
    local env_file="${PROJECT_DIR}/.env.${env}"
    
    if ! check_env_file "$env_file"; then
        print_error "Crie o arquivo $env_file primeiro"
        echo "Execute: cp .env.example .env.${env}"
        return 1
    fi
    
    # Verificar se variables críticas estão preenchidas
    local cert_path=$(grep "^NFE_CERTIFICATE_PATH=" "$env_file" | cut -d'=' -f2 | xargs)
    local cnpj=$(grep "^NFE_CNPJ=" "$env_file" | cut -d'=' -f2 | xargs)
    
    if [ -z "$cert_path" ] || [ "$cert_path" = "/path/to/your/test-certificate.pfx" ]; then
        print_warning "NFE_CERTIFICATE_PATH não está preenchido em $env_file"
    fi
    
    if [ -z "$cnpj" ]; then
        print_warning "NFE_CNPJ não está preenchido em $env_file"
    fi
    
    return 0
}

switch_to_environment() {
    local env=$1
    
    print_header "Trocando para Ambiente: $env"
    
    if ! validate_environment "$env"; then
        return 1
    fi
    
    # Criar/atualizar .env.local
    local env_file="${PROJECT_DIR}/.env.${env}"
    cp "$env_file" "${PROJECT_DIR}/.env.local"
    
    print_success "Ambiente alterado para: $env"
    
    if [ "$env" = "producao" ]; then
        print_warning "VOCÊ ESTÁ EM PRODUÇÃO!"
        print_warning "Certificado: $(grep '^NFE_CERTIFICATE_PATH=' "$env_file" | cut -d'=' -f2)"
        print_warning "CNPJ: $(grep '^NFE_CNPJ=' "$env_file" | cut -d'=' -f2)"
    else
        print_success "Ambiente seguro de TESTES ativado"
    fi
    
    # Exportar variável de ambiente
    export NFE_ENVIRONMENT=$env
    print_info "Variável \$NFE_ENVIRONMENT=$env exportada"
    
    return 0
}

show_status() {
    print_header "Status Atual do Ambiente NFe"
    
    # Verificar qual env está ativo
    if [ -f "${PROJECT_DIR}/.env.local" ]; then
        local current_env=$(grep "^NFE_ENVIRONMENT=" "${PROJECT_DIR}/.env.local" | cut -d'=' -f2 | xargs)
        
        if [ -n "$current_env" ]; then
            print_success "Ambiente ativo: $current_env"
            
            # Mostrar configurações
            echo ""
            print_info "Configurações atuais:"
            echo "  CNPJ: $(grep '^NFE_CNPJ=' "${PROJECT_DIR}/.env.local" | cut -d'=' -f2)"
            echo "  Certificado: $(grep '^NFE_CERTIFICATE_PATH=' "${PROJECT_DIR}/.env.local" | cut -d'=' -f2)"
            
            if [ "$current_env" = "producao" ]; then
                print_warning "⚠️  ATENÇÃO: Você está em PRODUÇÃO"
            else
                print_success "✅ Você está em TESTES (seguro)"
            fi
        else
            print_warning "Nenhum ambiente configurado"
        fi
    else
        print_error "Arquivo .env.local não encontrado"
        echo "Execute: ./switch-nfe-environment.sh homologacao"
    fi
    
    echo ""
    print_info "Ambientes disponíveis:"
    [ -f "${PROJECT_DIR}/.env.homologacao" ] && echo "  ✓ homologacao" || echo "  ✗ homologacao (não encontrado)"
    [ -f "${PROJECT_DIR}/.env.producao" ] && echo "  ✓ producao" || echo "  ✗ producao (não encontrado)"
}

list_environments() {
    print_header "Ambientes Disponíveis"
    
    echo "Homologação (TESTES):"
    echo "  ./switch-nfe-environment.sh homologacao"
    echo ""
    echo "Produção (REAL):"
    echo "  ./switch-nfe-environment.sh producao"
    echo ""
    echo "Status:"
    echo "  ./switch-nfe-environment.sh status"
    echo ""
    echo "Listar ambientes:"
    echo "  ./switch-nfe-environment.sh list"
}

# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

case "${1:-status}" in
    homologacao)
        switch_to_environment "homologacao"
        ;;
    producao)
        print_warning "Alterando para PRODUÇÃO - certifique-se de se que sabe o que faz!"
        read -p "Digite 'sim' para confirmar: " confirm
        if [ "$confirm" = "sim" ]; then
            switch_to_environment "producao"
        else
            print_error "Operação cancelada"
            exit 1
        fi
        ;;
    status)
        show_status
        ;;
    list)
        list_environments
        ;;
    *)
        echo "Uso: $0 [homologacao|producao|status|list]"
        echo ""
        list_environments
        exit 1
        ;;
esac
