#!/bin/bash

# AWS Deployment Script for Game Collection App
# Supports AWS App Runner, ECS, and EC2 deployment options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEPLOYMENT_TYPE="apprunner"
AWS_REGION="us-east-1"
APP_NAME="game-collection"
ECR_REPO_NAME="game-collection"
SERVICE_NAME="game-collection-service"
CPU="0.25 vCPU"
MEMORY="0.5 GB"

# Function to print colored output
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE       Deployment type (apprunner|ecs|ec2) [default: apprunner]"
    echo "  -r, --region REGION   AWS region [default: us-east-1]"
    echo "  -n, --name NAME       Application name [default: game-collection]"
    echo "  -c, --cpu CPU         CPU allocation [default: 0.25 vCPU]"
    echo "  -m, --memory MEMORY   Memory allocation [default: 0.5 GB]"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Deploy to App Runner with defaults"
    echo "  $0 -t ecs -r us-west-2              # Deploy to ECS in us-west-2"
    echo "  $0 -t apprunner -n my-games         # Deploy to App Runner with custom name"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        -r|--region)
            AWS_REGION="$2"
            shift 2
            ;;
        -n|--name)
            APP_NAME="$2"
            ECR_REPO_NAME="$2"
            SERVICE_NAME="$2-service"
            shift 2
            ;;
        -c|--cpu)
            CPU="$2"
            shift 2
            ;;
        -m|--memory)
            MEMORY="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate deployment type
if [[ ! "$DEPLOYMENT_TYPE" =~ ^(apprunner|ecs|ec2)$ ]]; then
    print_error "Invalid deployment type. Must be: apprunner, ecs, or ec2"
    exit 1
fi

print_header "Starting AWS deployment for $APP_NAME"
print_message "Deployment type: $DEPLOYMENT_TYPE"
print_message "AWS region: $AWS_REGION"
print_message "Application name: $APP_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"

print_message "AWS Account ID: $AWS_ACCOUNT_ID"
print_message "ECR URI: $ECR_URI"

# Create ECR repository if it doesn't exist
print_header "Setting up ECR repository"
if ! aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --region "$AWS_REGION" &> /dev/null; then
    print_message "Creating ECR repository: $ECR_REPO_NAME"
    aws ecr create-repository \
        --repository-name "$ECR_REPO_NAME" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true
else
    print_message "ECR repository already exists: $ECR_REPO_NAME"
fi

# Login to ECR
print_header "Logging into ECR"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Build Docker image
print_header "Building Docker image"
docker build -t "$APP_NAME" .

# Tag and push to ECR
print_header "Pushing image to ECR"
docker tag "$APP_NAME:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"

# Deploy based on type
case $DEPLOYMENT_TYPE in
    apprunner)
        print_header "Deploying to AWS App Runner"
        
        # Create apprunner.yaml if it doesn't exist
        if [[ ! -f "apprunner.yaml" ]]; then
            print_message "Creating App Runner configuration file"
            cat > apprunner.yaml << EOF
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "No build commands needed for pre-built container"
run:
  runtime-version: latest
  command: nginx -g 'daemon off;'
  network:
    port: 80
    env: PORT
  env:
    - name: NODE_ENV
      value: production
EOF
        fi

        # Create or update App Runner service
        if aws apprunner describe-service --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$SERVICE_NAME" &> /dev/null; then
            print_message "Updating existing App Runner service"
            aws apprunner update-service \
                --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$SERVICE_NAME" \
                --source-configuration '{
                    "ImageRepository": {
                        "ImageIdentifier": "'$ECR_URI':latest",
                        "ImageConfiguration": {
                            "Port": "80",
                            "RuntimeEnvironmentVariables": {
                                "NODE_ENV": "production"
                            }
                        },
                        "ImageRepositoryType": "ECR"
                    },
                    "AutoDeploymentsEnabled": true
                }' \
                --instance-configuration '{
                    "Cpu": "'$CPU'",
                    "Memory": "'$MEMORY'"
                }'
        else
            print_message "Creating new App Runner service"
            aws apprunner create-service \
                --service-name "$SERVICE_NAME" \
                --source-configuration '{
                    "ImageRepository": {
                        "ImageIdentifier": "'$ECR_URI':latest",
                        "ImageConfiguration": {
                            "Port": "80",
                            "RuntimeEnvironmentVariables": {
                                "NODE_ENV": "production"
                            }
                        },
                        "ImageRepositoryType": "ECR"
                    },
                    "AutoDeploymentsEnabled": true
                }' \
                --instance-configuration '{
                    "Cpu": "'$CPU'",
                    "Memory": "'$MEMORY'"
                }'
        fi

        # Wait for service to be running
        print_message "Waiting for App Runner service to be ready..."
        aws apprunner wait service-created --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$SERVICE_NAME"
        
        # Get service URL
        SERVICE_URL=$(aws apprunner describe-service \
            --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$SERVICE_NAME" \
            --query 'Service.ServiceUrl' \
            --output text)
        
        print_header "Deployment completed successfully!"
        print_message "Your application is available at: https://$SERVICE_URL"
        ;;
        
    ecs)
        print_error "ECS deployment not implemented yet. Please use App Runner for now."
        exit 1
        ;;
        
    ec2)
        print_error "EC2 deployment not implemented yet. Please use App Runner for now."
        exit 1
        ;;
esac

print_header "Deployment Summary"
print_message "✅ Docker image built and pushed to ECR"
print_message "✅ AWS App Runner service deployed"
print_message "✅ Application URL: https://$SERVICE_URL"
print_message ""
print_message "To monitor your deployment:"
print_message "  aws apprunner describe-service --service-arn arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$SERVICE_NAME"
print_message ""
print_message "To update your deployment:"
print_message "  ./scripts/deploy-aws.sh"
