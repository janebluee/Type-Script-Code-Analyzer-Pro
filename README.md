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

### 💾 Backup System (New in v1.1.0)
- Multiple backup formats (ZIP, RAR, TAR, GZ, Folder)
- Customizable backup location
- Selective backup with file/folder filtering
- Progress tracking with detailed statistics
- Smart exclusion of unnecessary files

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
  }
}
```

## Requirements

- Node.js >= 16
- TypeScript >= 4.0
- npm >= 7
- WinRAR (optional, for RAR format backups)

## What's New in v1.1.0
- Added comprehensive backup system
- Multiple backup format support
- Customizable backup locations
- Progress tracking and statistics
- Smart file filtering
- Improved error handling
- Enhanced TypeScript type safety

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
