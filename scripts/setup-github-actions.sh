#!/bin/bash

# GitHub Actions Setup Script for GCP Deployment
# This script helps configure the necessary secrets and service account for GitHub Actions

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
GITHUB_REPO=""
GITHUB_OWNER=""
SERVICE_ACCOUNT_NAME="github-actions-deployer"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Setup GitHub Actions for GCP deployment

OPTIONS:
    -p, --project-id PROJECT_ID     GCP Project ID (required)
    -r, --repo REPO                 GitHub repository name (required)
    -o, --owner OWNER               GitHub repository owner (required)
    -h, --help                      Show this help message

Examples:
    $0 -p my-gcp-project -r my-repo -o my-username
    $0 --project-id my-project --repo game-collection --owner myorg
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--repo)
            GITHUB_REPO="$2"
            shift 2
            ;;
        -o|--owner)
            GITHUB_OWNER="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option $1"
            ;;
    esac
done

# Validate required parameters
if [[ -z "$PROJECT_ID" ]]; then
    error "Project ID is required. Use -p or --project-id"
fi

if [[ -z "$GITHUB_REPO" ]]; then
    error "GitHub repository name is required. Use -r or --repo"
fi

if [[ -z "$GITHUB_OWNER" ]]; then
    error "GitHub repository owner is required. Use -o or --owner"
fi

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI is not installed. Please install it first."
    fi
    
    # Check GitHub CLI
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI is not installed. Please install it first: https://cli.github.com/"
    fi
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        error "gcloud is not authenticated. Run 'gcloud auth login' first."
    fi
    
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI is not authenticated. Run 'gh auth login' first."
    fi
    
    log "Prerequisites check passed"
}

# Set GCP project
set_project() {
    log "Setting GCP project to $PROJECT_ID..."
    gcloud config set project "$PROJECT_ID" || error "Failed to set project"
    log "Project set successfully"
}

# Enable required APIs
enable_apis() {
    log "Enabling required GCP APIs..."
    
    local apis=(
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "containerregistry.googleapis.com"
        "iam.googleapis.com"
        "cloudresourcemanager.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        info "Enabling $api..."
        gcloud services enable "$api" || warn "Failed to enable $api"
    done
    
    log "APIs enabled successfully"
}

# Create service account
create_service_account() {
    log "Creating service account for GitHub Actions..."
    
    local sa_email="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Create service account
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --description="Service account for GitHub Actions deployments" \
        --display-name="GitHub Actions Deployer" \
        || warn "Service account may already exist"
    
    # Grant necessary roles
    local roles=(
        "roles/run.admin"
        "roles/cloudbuild.builds.editor"
        "roles/storage.admin"
        "roles/iam.serviceAccountUser"
        "roles/storage.objectAdmin"
    )
    
    info "Granting IAM roles to service account..."
    for role in "${roles[@]}"; do
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$sa_email" \
            --role="$role" || warn "Failed to grant role $role"
    done
    
    log "Service account created and configured"
}

# Generate service account key
generate_service_account_key() {
    log "Generating service account key..."
    
    local sa_email="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    local key_file="github-actions-key.json"
    
    # Create key
    gcloud iam service-accounts keys create "$key_file" \
        --iam-account="$sa_email" || error "Failed to create service account key"
    
    echo "$key_file"
}

# Set GitHub repository secrets
set_github_secrets() {
    local key_file="$1"
    
    log "Setting GitHub repository secrets..."
    
    # Set secrets
    info "Setting GCP_PROJECT_ID secret..."
    gh secret set GCP_PROJECT_ID -b "$PROJECT_ID" --repo "$GITHUB_OWNER/$GITHUB_REPO"
    
    info "Setting GCP_SA_KEY secret..."
    gh secret set GCP_SA_KEY -b "$(cat $key_file)" --repo "$GITHUB_OWNER/$GITHUB_REPO"
    
    # Clean up key file
    rm "$key_file"
    
    log "GitHub secrets configured successfully"
}

# Display final instructions
display_instructions() {
    log "🎉 GitHub Actions setup completed successfully!"
    
    echo ""
    echo "📋 Configuration Summary:"
    echo "  • GCP Project ID: $PROJECT_ID"
    echo "  • GitHub Repository: $GITHUB_OWNER/$GITHUB_REPO"
    echo "  • Service Account: $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Push your code to the main/master branch"
    echo "  2. GitHub Actions will automatically:"
    echo "     • Run tests"
    echo "     • Build Docker image"
    echo "     • Deploy to Cloud Run"
    echo "     • Provide deployment URL"
    echo ""
    echo "🔍 Monitor your deployments at:"
    echo "  • GitHub Actions: https://github.com/$GITHUB_OWNER/$GITHUB_REPO/actions"
    echo "  • Cloud Run Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
    echo ""
    echo "⚙️ Workflow features:"
    echo "  • Automatic testing before deployment"
    echo "  • PR preview deployments with comments"
    echo "  • Automatic cleanup of old container images"
    echo "  • Secure deployment using service account"
}

# Main function
main() {
    log "Starting GitHub Actions setup for GCP deployment"
    log "Project ID: $PROJECT_ID"
    log "Repository: $GITHUB_OWNER/$GITHUB_REPO"
    
    check_prerequisites
    set_project
    enable_apis
    create_service_account
    
    local key_file
    key_file=$(generate_service_account_key)
    
    set_github_secrets "$key_file"
    display_instructions
    
    log "✅ Setup completed successfully!"
}

# Run main function
main "$@"
