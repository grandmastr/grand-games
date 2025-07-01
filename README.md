# Test212 - React Game Collection

A collection of interactive browser games built with React and TypeScript, ready for cloud deployment.

## 🎮 Games Included

- **🐍 Snake Game** - Classic snake game with arrow key controls
- **🎈 Water Balloon Game** - Interactive water balloon game
- **🧩 Copilot Tetris** - Tetris implementation with modern styling

## ⚛️ Tech Stack

- **React 18.3.1** with TypeScript
- **Modern React Hooks** (useState, useEffect, useRef)
- **CSS Styling** for game interfaces
- **Jest** for testing
- **Docker** containerization
- **Nginx** for production serving

## 🚀 Deployment Options

### GitHub Actions (Recommended)
Automated CI/CD pipeline with testing and deployment to Google Cloud Platform.

**Features:**
- ✅ Automated testing on every push
- ✅ Serverless container deployment
- ✅ Automatic scaling (0 to 10 instances)
- ✅ HTTPS enabled by default
- ✅ PR preview deployments
- ✅ Automatic cleanup of old images
- ✅ Pay-per-use pricing (~$2-10/month for moderate traffic)

📖 **[GitHub Actions Deployment Guide](GITHUB_ACTIONS_DEPLOYMENT.md)**

### Manual GCP Deployment
Direct deployment using the comprehensive deployment script.

**Features:**
- ✅ Serverless container deployment
- ✅ Automatic scaling (0 to 25 instances)
- ✅ HTTPS enabled by default
- ✅ Load balancing and health checks
- ✅ Built-in monitoring and logging
- ✅ Pay-per-use pricing (~$2-10/month for moderate traffic)

📖 **[Manual GCP Deployment Guide](AWS_DEPLOYMENT_GUIDE.md)**

### AWS App Runner
Alternative deployment to AWS using App Runner configuration.

**Features:**
- ✅ Serverless container deployment
- ✅ Automatic scaling and load balancing
- ✅ Built-in monitoring and logging
- ✅ Pay-per-use pricing model

## 🏃‍♂️ Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Deploy with GitHub Actions (Recommended)

1. **Fork or clone this repository**
2. **Follow the [GitHub Actions Deployment Guide](GITHUB_ACTIONS_DEPLOYMENT.md)**
3. **Push to main branch and watch automatic deployment**

### Manual Deployment

```bash
# GCP Deployment
./scripts/deploy-gcp.sh --project-id YOUR_GCP_PROJECT_ID

# GitHub Actions Setup
./scripts/setup-github-actions.sh \
  --project-id YOUR_GCP_PROJECT_ID \
  --repo YOUR_REPO_NAME \
  --owner YOUR_GITHUB_USERNAME
```

## 📁 Project Structure

```
test212/
├── src/
│   ├── components/          # Game components
│   │   ├── SnakeGame.tsx
│   │   └── WaterBalloonGame.tsx
│   └── copilot_games/       # Additional games
│       ├── CopilotTetris.tsx
│       └── CopilotTetris.css
├── scripts/                 # Deployment scripts
│   ├── deploy-gcp.sh
│   └── setup-github-actions.sh
├── .github/workflows/       # CI/CD workflows
│   └── deploy-gcp.yml
├── Dockerfile              # Multi-stage container build
├── nginx.conf              # Production web server config
└── apprunner.yaml          # AWS App Runner config
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV=production` - Set automatically in production
- `PORT` - Container port (default: 8080 for GCP, 80 for AWS)

### Docker Configuration
The project uses a multi-stage Docker build:
1. **Build stage**: Node.js 18 Alpine for building React app
2. **Production stage**: Nginx Alpine for serving static files

### Cloud Run Configuration
- **Memory**: 512Mi
- **CPU**: 1 vCPU
- **Scaling**: 0-10 instances
- **Concurrency**: 80 requests per instance
- **Timeout**: 5 minutes

## 🎯 Game Controls

### Snake Game
- **Arrow Keys**: Control snake direction
- **Goal**: Eat food to grow, avoid hitting yourself

### Water Balloon Game
- **Interactive controls** based on game mechanics

### Copilot Tetris
- **Standard Tetris controls** for piece movement and rotation

## 📊 Monitoring

After deployment, monitor your application:
- **GitHub Actions**: Repository Actions tab
- **Cloud Run Console**: GCP Cloud Run dashboard
- **Service Logs**: Available in GCP Console

## 🛠️ Development

### Adding New Games
1. Create new component in `src/components/`
2. Import and add to main App component
3. Add appropriate styling
4. Test locally with `npm start`

### Customizing Deployment
- Modify `.github/workflows/deploy-gcp.yml` for CI/CD changes
- Update `scripts/deploy-gcp.sh` for manual deployment options
- Adjust `Dockerfile` for container configuration

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the deployment guides
2. Review GitHub Actions logs
3. Check Cloud Run logs in GCP Console
4. Open an issue in this repository

---

**Ready to deploy your games to the cloud? Start with the [GitHub Actions Deployment Guide](GITHUB_ACTIONS_DEPLOYMENT.md)!** 🚀🎮
