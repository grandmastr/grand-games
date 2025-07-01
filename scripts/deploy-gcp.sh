#!/bin/bash

# GCP Deployment Script for React Game Collection
# This script automates the entire deployment process to Google Cloud Platform

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="game-collection"
GITHUB_REPO=""
GITHUB_OWNER=""
CONTAINER_IMAGE=""

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

Deploy React Game Collection to Google Cloud Platform

OPTIONS:
    -p, --project-id PROJECT_ID     GCP Project ID (required)
    -r, --region REGION            GCP Region (default: us-central1)
    -s, --service-name NAME        Cloud Run service name (default: game-collection)
    -g, --github-repo REPO         GitHub repository name
    -o, --github-owner OWNER       GitHub repository owner
    -t, --terraform                Use Terraform for deployment
    -b, --build-only               Only build and push image, don't deploy
    -d, --deploy-only              Only deploy (assume image exists)
    -c, --cleanup                  Clean up resources
    -h, --help                     Show this help message

Examples:
    $0 -p my-project-id
    $0 -p my-project-id -r europe-west1 -s my-game-app
    $0 -p my-project-id -t  # Use Terraform
    $0 -p my-project-id -c  # Clean up resources
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -s|--service-name)
            SERVICE_NAME="$2"
            shift 2
            ;;
        -g|--github-repo)
            GITHUB_REPO="$2"
            shift 2
            ;;
        -o|--github-owner)
            GITHUB_OWNER="$2"
            shift 2
            ;;
        -t|--terraform)
            USE_TERRAFORM=true
            shift
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -d|--deploy-only)
            DEPLOY_ONLY=true
            shift
            ;;
        -c|--cleanup)
            CLEANUP=true
            shift
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

CONTAINER_IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# Check if gcloud is installed and authenticated
check_gcloud() {
    log "Checking gcloud CLI..."
    
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI is not installed. Please install it first."
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        error "gcloud is not authenticated. Run 'gcloud auth login' first."
    fi
    
    log "gcloud CLI is ready"
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
        "monitoring.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        info "Enabling $api..."
        gcloud services enable "$api" || warn "Failed to enable $api"
    done
    
    log "APIs enabled successfully"
}

# Build and push Docker image
build_and_push() {
    log "Building and pushing Docker image..."
    
    # Build the image
    info "Building Docker image: $CONTAINER_IMAGE"
    docker build -t "$CONTAINER_IMAGE" . || error "Docker build failed"
    
    # Configure Docker for GCR
    info "Configuring Docker for Google Container Registry..."
    gcloud auth configure-docker || error "Docker configuration failed"
    
    # Push the image
    info "Pushing image to Google Container Registry..."
    docker push "$CONTAINER_IMAGE" || error "Docker push failed"
    
    log "Image built and pushed successfully"
}

# Deploy using gcloud
deploy_gcloud() {
    log "Deploying to Cloud Run using gcloud..."
    
    gcloud run deploy "$SERVICE_NAME" \
        --image "$CONTAINER_IMAGE" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 80 \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 10 \
        --min-instances 0 \
        --concurrency 80 \
        --timeout 300 \
        --set-env-vars NODE_ENV=production \
        || error "Cloud Run deployment failed"
    
    log "Deployment completed successfully"
}

# Deploy using Terraform
deploy_terraform() {
    log "Deploying using Terraform..."
    
    if [[ ! -d "terraform" ]]; then
        error "Terraform directory not found"
    fi
    
    cd terraform
    
    # Create terraform.tfvars if it doesn't exist
    if [[ ! -f "terraform.tfvars" ]]; then
        info "Creating terraform.tfvars from example..."
        cp terraform.tfvars.example terraform.tfvars
        sed -i.bak "s/your-gcp-project-id/$PROJECT_ID/g" terraform.tfvars
        sed -i.bak "s/us-central1/$REGION/g" terraform.tfvars
        sed -i.bak "s/game-collection/$SERVICE_NAME/g" terraform.tfvars
        rm terraform.tfvars.bak
        warn "Please review and update terraform.tfvars with your specific values"
    fi
    
    # Initialize Terraform
    info "Initializing Terraform..."
    terraform init || error "Terraform init failed"
    
    # Plan the deployment
    info "Planning Terraform deployment..."
    terraform plan || error "Terraform plan failed"
    
    # Apply the configuration
    info "Applying Terraform configuration..."
    terraform apply -auto-approve || error "Terraform apply failed"
    
    cd ..
    log "Terraform deployment completed successfully"
}

# Get service URL
get_service_url() {
    log "Getting service URL..."
    
    local url
    url=$(gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --format="value(status.url)") || error "Failed to get service URL"
    
    log "Service URL: $url"
    echo "$url"
}

# Clean up resources
cleanup() {
    log "Cleaning up resources..."
    
    # Delete Cloud Run service
    info "Deleting Cloud Run service..."
    gcloud run services delete "$SERVICE_NAME" \
        --region "$REGION" \
        --quiet || warn "Failed to delete Cloud Run service"
    
    # Delete container images
    info "Deleting container images..."
    gcloud container images delete "$CONTAINER_IMAGE" \
        --force-delete-tags \
        --quiet || warn "Failed to delete container images"
    
    log "Cleanup completed"
}

# Setup GitHub Actions secrets
setup_github_secrets() {
    if [[ -n "$GITHUB_REPO" && -n "$GITHUB_OWNER" ]]; then
        log "Setting up GitHub Actions secrets..."
        
        # Check if GitHub CLI is installed
        if command -v gh &> /dev/null; then
            info "Creating service account for GitHub Actions..."
            
            # Create service account
            gcloud iam service-accounts create github-actions \
                --description="Service account for GitHub Actions" \
                --display-name="GitHub Actions" || warn "Service account may already exist"
            
            # Grant permissions
            local sa_email="github-actions@$PROJECT_ID.iam.gserviceaccount.com"
            local roles=(
                "roles/run.admin"
                "roles/cloudbuild.builds.editor"
                "roles/storage.admin"
                "roles/iam.serviceAccountUser"
            )
            
            for role in "${roles[@]}"; do
                gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                    --member="serviceAccount:$sa_email" \
                    --role="$role" || warn "Failed to grant role $role"
            done
            
            # Create and download key
            local key_file="github-actions-key.json"
            gcloud iam service-accounts keys create "$key_file" \
                --iam-account="$sa_email" || error "Failed to create service account key"
            
            # Set GitHub secrets
            info "Setting GitHub repository secrets..."
            gh secret set GCP_PROJECT_ID -b "$PROJECT_ID" --repo "$GITHUB_OWNER/$GITHUB_REPO"
            gh secret set GCP_SA_KEY -b "$(cat $key_file)" --repo "$GITHUB_OWNER/$GITHUB_REPO"
            
            # Clean up key file
            rm "$key_file"
            
            log "GitHub Actions setup completed"
        else
            warn "GitHub CLI not found. Please set up GitHub secrets manually."
            info "Required secrets: GCP_PROJECT_ID, GCP_SA_KEY"
        fi
    fi
}

# Main deployment function
main() {
    log "Starting GCP deployment for React Game Collection"
    log "Project ID: $PROJECT_ID"
    log "Region: $REGION"
    log "Service Name: $SERVICE_NAME"
    
    # Check prerequisites
    check_gcloud
    set_project
    
    if [[ "$CLEANUP" == "true" ]]; then
        cleanup
        return 0
    fi
    
    # Enable APIs
    enable_apis
    
    # Build and push image (unless deploy-only)
    if [[ "$DEPLOY_ONLY" != "true" ]]; then
        build_and_push
    fi
    
    # Deploy (unless build-only)
    if [[ "$BUILD_ONLY" != "true" ]]; then
        if [[ "$USE_TERRAFORM" == "true" ]]; then
            deploy_terraform
        else
            deploy_gcloud
        fi
        
        # Get and display service URL
        local service_url
        service_url=$(get_service_url)
        
        log "🎮 Game Collection deployed successfully!"
        log "🌐 Service URL: $service_url"
        log "🔧 You can view logs with: gcloud run services logs $SERVICE_NAME --region $REGION"
    fi
    
    # Setup GitHub Actions if requested
    setup_github_secrets
    
    log "🚀 Deployment process completed!"
}

# Run main function
main "$@"
