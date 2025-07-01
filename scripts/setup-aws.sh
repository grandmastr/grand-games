#!/bin/bash

# AWS Setup Script for Game Collection Deployment
# This script helps set up AWS credentials and dependencies for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo -e "${BLUE}[SETUP]${NC} $1"
}

print_header "AWS Setup for Game Collection Deployment"

# Check if AWS CLI is installed
print_message "Checking AWS CLI installation..."
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed."
    print_message "Please install AWS CLI first:"
    print_message "  macOS: brew install awscli"
    print_message "  Linux: pip install awscli"
    print_message "  Windows: Download from https://aws.amazon.com/cli/"
    exit 1
else
    print_message "✅ AWS CLI is installed: $(aws --version)"
fi

# Check if Docker is installed
print_message "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed."
    print_message "Please install Docker first:"
    print_message "  Visit: https://docs.docker.com/get-docker/"
    exit 1
else
    print_message "✅ Docker is installed: $(docker --version)"
fi

# Check Docker daemon
if ! docker info &> /dev/null; then
    print_warning "Docker daemon is not running. Please start Docker Desktop."
    exit 1
else
    print_message "✅ Docker daemon is running"
fi

# Check AWS credentials
print_message "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_warning "AWS credentials are not configured."
    print_message "Setting up AWS credentials..."
    
    echo
    print_header "AWS Credential Configuration"
    print_message "You'll need:"
    print_message "  1. AWS Access Key ID"
    print_message "  2. AWS Secret Access Key"
    print_message "  3. Default region (e.g., us-east-1)"
    print_message "  4. Default output format (json recommended)"
    echo
    print_message "If you don't have these, create them in AWS Console:"
    print_message "  IAM → Users → [Your User] → Security credentials → Create access key"
    echo
    
    read -p "Do you want to configure AWS credentials now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        aws configure
        
        # Verify configuration
        if aws sts get-caller-identity &> /dev/null; then
            print_message "✅ AWS credentials configured successfully!"
            
            # Display account info
            ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
            USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
            print_message "Account ID: $ACCOUNT_ID"
            print_message "User: $USER_ARN"
        else
            print_error "AWS credential configuration failed. Please try again."
            exit 1
        fi
    else
        print_message "Please configure AWS credentials manually:"
        print_message "  aws configure"
        exit 1
    fi
else
    print_message "✅ AWS credentials are configured"
    
    # Display account info
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    print_message "Account ID: $ACCOUNT_ID"
    print_message "User: $USER_ARN"
fi

# Check required permissions
print_message "Checking AWS permissions..."
print_message "Testing ECR permissions..."

# Test ECR permissions (non-destructive)
if aws ecr describe-repositories --region us-east-1 &> /dev/null; then
    print_message "✅ ECR permissions are working"
else
    print_warning "ECR permissions may be limited. The deployment script will create repositories as needed."
fi

print_message "Testing App Runner permissions..."
if aws apprunner list-services --region us-east-1 &> /dev/null; then
    print_message "✅ App Runner permissions are working"
else
    print_warning "App Runner permissions may be limited. Please ensure you have the required permissions."
fi

# Verify Node.js and npm
print_message "Checking Node.js installation..."
if command -v node &> /dev/null; then
    print_message "✅ Node.js is installed: $(node --version)"
else
    print_warning "Node.js is not installed. It's not required for Docker deployment but useful for local development."
fi

if command -v npm &> /dev/null; then
    print_message "✅ npm is installed: $(npm --version)"
else
    print_warning "npm is not installed. It's not required for Docker deployment but useful for local development."
fi

print_header "Setup Complete!"
print_message "Your system is ready for AWS deployment."
print_message ""
print_message "Next steps:"
print_message "  1. Run: ./scripts/deploy-aws.sh"
print_message "  2. Or use GitHub Actions for automated deployment"
print_message "  3. Check AWS_DEPLOYMENT_GUIDE.md for detailed instructions"
print_message ""
print_message "🚀 Ready to deploy your game collection!"
