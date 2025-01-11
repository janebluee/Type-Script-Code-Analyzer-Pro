# TypeScript Code Analyzer Pro

An advanced TypeScript code analysis tool with real-time analysis capabilities, performance optimization, memory leak detection, and dependency analysis.

## Features

### 🚀 Code Analysis
- Loop optimization suggestions
- Memory usage patterns
- Function complexity metrics
- Code optimization recommendations

### 🔍 Memory Management
- Event listener tracking
- Closure analysis
- Timer cleanup verification
- Object accumulation detection

### 📊 Dependency Analysis
- Circular dependency detection
- Dependency graph visualization
- Import/Export analysis
- Package version compatibility check

### 💾 Backup System
- Multiple backup formats (ZIP, RAR, TAR, GZ, Folder)
- Customizable backup location
- Selective backup with file/folder filtering
- Progress tracking with detailed statistics
- Smart exclusion of unnecessary files

### 🎯 Smart Commands (New in v2.0.0)
- Interactive command mode with auto-completion
- Command history tracking
- Custom command aliases
- Fuzzy search for commands
- Smart suggestions based on usage

### 🚀 Deployment Integration (New in v2.0.0)
- Multi-platform deployment support
- Cloud provider integrations
- Environment-specific configurations
- Automated CLI tool installation
- Deployment status tracking

## Installation

```bash
# Install globally
npm install -g typescript-code-analyzer-pro

# Or install in your project
npm install --save-dev typescript-code-analyzer-pro
```

## Quick Start

### Code Analysis
```bash
# Initialize analyzer in your project
tsa init

# Analyze your project
tsa analyze

# Generate HTML report
tsa analyze --output html

# Focus on specific aspects
tsa analyze --perf    # Performance only
tsa analyze --memory  # Memory leaks only
tsa analyze --deps    # Dependencies only
```

### Backup System
```bash
# Quick backup (defaults to ZIP format)
tsa backup src/

# Choose backup format
tsa backup src/ -f zip   # ZIP format
tsa backup src/ -f rar   # RAR format (requires WinRAR)
tsa backup src/ -f tar   # TAR format
tsa backup src/ -f gz    # GZIP format
tsa backup src/ -f folder # Simple folder copy

# Custom backup location
tsa backup src/ -d D:/backups

# Backup entire project (excludes node_modules, etc.)
tsa backup . --all

# Full backup with all options
tsa backup . --all -f zip -d D:/my-backups
```

### Deployment
```bash
# Deploy to default platform (specified in tsa.config.json)
tsa deploy

# Deploy to specific platform
tsa deploy --platform vercel
tsa deploy --platform netlify
tsa deploy --platform aws --region ap-southeast-1
tsa deploy --platform azure
tsa deploy --platform gcp

# Deploy with environment
tsa deploy --platform vercel --environment staging
```

### Smart Commands
```bash
# Enter interactive mode
tsa smart

# Create command alias
tsa alias qa "analyze --perf --memory"  # Create alias 'qa' for quick analysis
tsa alias qb "backup . --all -f zip"    # Create alias 'qb' for quick backup

# View command history
tsa history
```

## Command Options

### `tsa analyze`
- `-p, --path <path>` - Path to TypeScript project (default: current directory)
- `--perf` - Only analyze performance issues
- `--memory` - Only analyze memory leaks
- `--deps` - Only analyze dependencies
- `-o, --output <format>` - Output format (json, html, terminal)

### `tsa backup`
- `<source>` - Source file or directory to backup
- `-f, --format <format>` - Backup format (zip, rar, tar, gz, folder)
- `-d, --destination <path>` - Custom backup location
- `--all` - Backup entire project (excludes node_modules, backups, .git, etc.)

### `tsa deploy`
- `--platform <platform>` - Deployment platform (vercel, netlify, aws, azure, gcp)
- `--environment <environment>` - Deployment environment (production, staging, etc.)

### `tsa smart`
Enters interactive mode with command auto-completion and suggestions.

### `tsa alias`
- `<alias>` - Name of the alias
- `<command>` - Full command to alias

### `tsa history`
Shows command execution history.

### `tsa init`
Initializes configuration in your project. This creates a `tsa.config.json` file with your preferred settings.

## Output Formats

### Analysis Output
- Terminal output with color-coded sections
- Interactive HTML reports
- Structured JSON for CI/CD integration
- Visual dependency graphs

### Backup Output
- Compressed archives (ZIP, RAR, TAR.GZ)
- Uncompressed archives (TAR)
- Direct folder copies
- Detailed backup statistics

## Configuration

The `tsa.config.json` file supports:

```json
{
  "include": ["src"],
  "analysis": {
    "performance": true,
    "memory": true,
    "dependencies": true
  },
  "reporting": {
    "format": "terminal",
    "output": "./tsa-reports"
  },
  "backup": {
    "defaultFormat": "zip",
    "defaultDestination": "./backups",
    "exclude": ["node_modules", ".git", "dist"]
  },
  "deployment": {
    "defaultPlatform": "vercel",
    "environments": {
      "production": {
        "branch": "main",
        "autoApprove": false
      },
      "staging": {
        "branch": "develop",
        "autoApprove": true
      }
    },
    "platforms": {
      "vercel": {
        "team": "",
        "project": ""
      },
      "netlify": {
        "site": "",
        "team": ""
      },
      "aws": {
        "region": "us-east-1",
        "profile": "default"
      },
      "azure": {
        "subscription": "",
        "resourceGroup": ""
      },
      "gcp": {
        "project": "",
        "region": "us-central1"
      }
    }
  },
  "smart": {
    "historySize": 50,
    "suggestionsLimit": 10,
    "fuzzyMatchThreshold": 0.4
  }
}
```

## Requirements

- Node.js >= 16
- TypeScript >= 4.0
- npm >= 7
- WinRAR (optional, for RAR format backups)

## What's New in v2.0.0
- Added Smart Commands system with auto-completion
- Command history tracking and management
- Custom command aliases support
- Interactive command mode with fuzzy search
- Added comprehensive backup system
- Multiple backup format support
- Customizable backup locations
- Progress tracking and statistics
- Smart file filtering
- Improved error handling
- Enhanced TypeScript type safety
- Deployment integration with multiple platforms

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, issues, or feature requests, please file an issue in the GitHub repository.

## 🎨 Project Templates

Create new projects with pre-configured templates using our template system:

```bash
tsa template <name> [options]

Options:
  -t, --template <name>    Template to use (default: "react-ts")
  -p, --path <path>        Custom project path
  -d, --database <type>    Add database support (prisma/typeorm/mongoose/sequelize)
  -a, --auth              Add authentication
  --api                   Add API support
  --pwa                   Add PWA support
  --docker                Add Docker configuration
  --ci                    Add CI/CD setup
  --testing               Add testing configuration
```

### Frontend Templates
- ⚛️ **React + TypeScript**: Modern React setup with latest features
  ```bash
  tsa template my-app -t react-ts
  ```
- 📱 **Next.js Full-Stack**: Complete Next.js setup with API routes
  ```bash
  tsa template my-app -t next-ts --database prisma --auth
  ```
- 🎭 **Vue + TypeScript**: Vue 3 with Composition API
  ```bash
  tsa template my-app -t vue-ts
  ```
- ⚡ **SvelteKit**: Fast and efficient Svelte setup
  ```bash
  tsa template my-app -t svelte-ts
  ```

### Backend Templates
- 🚀 **Express + TypeScript**: Production-ready REST API
  ```bash
  tsa template my-api -t express-ts --database typeorm --docker
  ```
- 🦅 **NestJS Advanced**: Enterprise-grade NestJS setup
  ```bash
  tsa template my-api -t nest-ts --database prisma --auth --api
  ```
- ⚡ **Fastify + TypeScript**: High-performance API server
  ```bash
  tsa template my-api -t fastify-ts --database mongoose
  ```

### Full-Stack Templates
- 🎯 **T3 Stack**: Next.js + tRPC + Prisma
  ```bash
  tsa template my-app -t t3-stack
  ```
- 💎 **MERN Stack**: MongoDB + Express + React + Node
  ```bash
  tsa template my-app -t mern-ts --docker --ci
  ```
- 🚀 **Remix Full-Stack**: Modern full-stack framework
  ```bash
  tsa template my-app -t remix-ts --database prisma
  ```

### Mobile & Desktop
- 📱 **React Native**: Cross-platform mobile apps
  ```bash
  tsa template my-app -t react-native-ts
  ```
- 🖥️ **Electron**: Desktop applications
  ```bash
  tsa template my-app -t electron-ts
  ```
- ⚡ **Tauri**: Lightweight desktop apps
  ```bash
  tsa template my-app -t tauri-ts
  ```
