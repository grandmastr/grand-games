# Netlify Deployment Setup

This project is configured for automatic deployment to Netlify via GitHub Actions.

## Required GitHub Secrets

To enable automatic deployments, you need to add the following secrets to your GitHub repository:

### 1. NETLIFY_AUTH_TOKEN
- Go to [Netlify User Settings](https://app.netlify.com/user/applications#personal-access-tokens)
- Click "New access token"
- Give it a descriptive name (e.g., "GitHub Actions Deploy")
- Copy the generated token

### 2. NETLIFY_SITE_ID
- Go to your Netlify site dashboard
- Navigate to Site settings > General > Site details
- Copy the "Site ID" (also called "API ID")

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add both secrets:
   - Name: `NETLIFY_AUTH_TOKEN`, Value: your Netlify personal access token
   - Name: `NETLIFY_SITE_ID`, Value: your Netlify site ID

## How It Works

The GitHub Action will:
- Trigger on pushes to the `main` branch and pull requests
- Install dependencies using pnpm
- Run tests with coverage
- Build the React application
- Deploy to Netlify automatically

## Deployment Process

1. **Production Deployment**: Pushes to `main` branch deploy to your production site
2. **Preview Deployments**: Pull requests create preview deployments for testing
3. **Build Artifacts**: The `build` folder is deployed to Netlify
4. **Caching**: Dependencies are cached to speed up subsequent builds

## Troubleshooting

- Check the Actions tab in your GitHub repository for build logs
- Ensure your Netlify site is properly configured
- Verify that the secrets are correctly set in GitHub
- Make sure your `netlify.toml` configuration matches your build output directory

## Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Run tests
pnpm test

# Build for production
pnpm run build
```
