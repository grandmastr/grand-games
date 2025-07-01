# GitHub Actions Deployment Guide

This guide walks you through setting up automated deployment to Google Cloud Platform using GitHub Actions.

## 🚀 Quick Start

1. **Prerequisites Setup**
2. **Configure GitHub Repository**
3. **Push and Deploy**

## Prerequisites

Before setting up GitHub Actions deployment, ensure you have:

- **Google Cloud Platform Account**: Active GCP account with billing enabled
- **GCP Project**: A project where you want to deploy your application
- **GitHub Repository**: Your code pushed to a GitHub repository
- **Local Tools**:
  - [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated
  - [GitHub CLI](https://cli.github.com/) installed and authenticated

## Setup Instructions

### Step 1: Install and Authenticate Tools

```bash
# Install gcloud CLI (if not already installed)
# Follow instructions at: https://cloud.google.com/sdk/docs/install

# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# Install GitHub CLI (if not already installed)
# Follow instructions at: https://cli.github.com/

# Authenticate with GitHub
gh auth login
```

### Step 2: Run the Setup Script

Use the provided setup script to configure everything automatically:

```bash
# Make the script executable (if not already)
chmod +x scripts/setup-github-actions.sh

# Run the setup script
./scripts/setup-github-actions.sh \
  --project-id YOUR_GCP_PROJECT_ID \
  --repo YOUR_REPO_NAME \
  --owner YOUR_GITHUB_USERNAME
```

**Example:**
```bash
./scripts/setup-github-actions.sh \
  --project-id my-games-project-123 \
  --repo test212 \
  --owner myusername
```

### Step 3: Manual Setup (Alternative)

If you prefer manual setup, follow these steps:

#### 3.1 Enable GCP APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable iam.googleapis.com
```

#### 3.2 Create Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions-deployer \
  --description="Service account for GitHub Actions deployments" \
  --display-name="GitHub Actions Deployer"

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

#### 3.3 Generate Service Account Key

```bash
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account="github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com"
```

#### 3.4 Set GitHub Secrets

```bash
# Set the project ID secret
gh secret set GCP_PROJECT_ID -b "YOUR_PROJECT_ID" --repo OWNER/REPO

# Set the service account key secret
gh secret set GCP_SA_KEY -b "$(cat github-actions-key.json)" --repo OWNER/REPO

# Clean up the key file
rm github-actions-key.json
```

## Deployment Workflow

The GitHub Actions workflow automatically:

### 🧪 Testing Phase
- Runs on every push and pull request
- Installs dependencies with `npm ci`
- Executes test suite with coverage
- Builds the React application
- Uploads build artifacts

### 🚀 Deployment Phase (main/master branch only)
- Authenticates with Google Cloud
- Builds optimized Docker image
- Pushes image to Google Container Registry
- Deploys to Cloud Run with:
  - 512Mi memory, 1 CPU
  - Auto-scaling (0-10 instances)
  - 80 concurrent requests per instance
  - 5-minute timeout
  - HTTPS enabled

### 🧹 Cleanup Phase
- Automatically removes old container images
- Keeps only the 5 most recent versions

## Configuration Options

### Environment Variables

You can modify these in `.github/workflows/deploy-gcp.yml`:

```yaml
env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE_NAME: game-collection          # Change service name
  REGION: us-central1                    # Change deployment region
```

### Cloud Run Configuration

Adjust deployment settings in the workflow:

```yaml
- name: Deploy to Cloud Run
  run: |
    gcloud run deploy $SERVICE_NAME \
      --memory 512Mi \           # Adjust memory
      --cpu 1 \                  # Adjust CPU
      --max-instances 10 \       # Adjust max scaling
      --min-instances 0 \        # Adjust min scaling
      --concurrency 80 \         # Adjust concurrent requests
      --timeout 300              # Adjust timeout (seconds)
```

## Monitoring and Debugging

### View Deployment Status

- **GitHub Actions**: `https://github.com/OWNER/REPO/actions`
- **Cloud Run Console**: `https://console.cloud.google.com/run?project=PROJECT_ID`

### Common Issues and Solutions

#### 1. Authentication Errors
```bash
# Re-authenticate gcloud
gcloud auth login
gcloud auth application-default login

# Re-authenticate GitHub CLI
gh auth login
```

#### 2. API Not Enabled
```bash
# Enable all required APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

#### 3. Permission Denied
```bash
# Check service account permissions
gcloud projects get-iam-policy PROJECT_ID
```

#### 4. Build Failures
- Check the Docker build process in GitHub Actions logs
- Verify Dockerfile syntax
- Ensure all dependencies are properly specified

### Debugging Commands

```bash
# View Cloud Run service details
gcloud run services describe game-collection --region us-central1

# View service logs
gcloud run services logs game-collection --region us-central1

# List container images
gcloud container images list --repository=gcr.io/PROJECT_ID

# Check GitHub Actions workflow status
gh run list --repo OWNER/REPO
```

## Cost Optimization

### Expected Costs
- **Cloud Run**: Pay-per-use, ~$2-10/month for moderate traffic
- **Container Registry**: ~$0.10/GB/month for image storage
- **Cloud Build**: 120 free build-minutes/day

### Cost Optimization Tips
1. Use the automatic cleanup workflow to remove old images
2. Set appropriate min/max instances based on traffic
3. Monitor usage in GCP Console
4. Consider Cloud Run's generous free tier

## Security Best Practices

1. **Service Account Principle of Least Privilege**: Only grant necessary permissions
2. **Secret Management**: Never commit GCP credentials to repository
3. **Regular Key Rotation**: Rotate service account keys periodically
4. **Branch Protection**: Enable branch protection rules for main/master

## Customization

### Adding Environment Variables

1. Add secrets to GitHub repository:
```bash
gh secret set MY_SECRET -b "secret-value" --repo OWNER/REPO
```

2. Update workflow to use the secret:
```yaml
--set-env-vars MY_ENV_VAR=${{ secrets.MY_SECRET }}
```

### Multi-Environment Deployment

Create separate workflows for different environments:
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

Use different service names and configurations for each environment.

## Support

If you encounter issues:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review [Cloud Run documentation](https://cloud.google.com/run/docs)
3. Check the workflow logs in GitHub Actions tab
4. Review Cloud Run logs in GCP Console

## Next Steps

After successful deployment:

1. **Custom Domain**: Configure a custom domain for your service
2. **Monitoring**: Set up monitoring and alerting
3. **CDN**: Consider adding Cloud CDN for better performance
4. **Security**: Implement additional security measures as needed

Your games will be accessible at the Cloud Run service URL provided in the deployment output! 🎮
