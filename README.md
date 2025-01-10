# TypeScript Code Analyzer Pro

An advanced TypeScript code analysis tool with real-time analysis capabilities, performance optimization, memory leak detection, and dependency analysis.

## Features

- **Performance Analysis**
  - Loop optimization suggestions
  - Memory usage patterns
  - Function complexity metrics
  - Code optimization recommendations

- **Memory Leak Detection**
  - Event listener tracking
  - Closure analysis
  - Timer cleanup verification
  - Object accumulation detection

- **Dependency Analysis**
  - Circular dependency detection
  - Dependency graph visualization
  - Import/Export analysis
  - Package version compatibility check

## Installation

```bash
# Install globally
npm install -g typescript-code-analyzer-pro

# Or install in your project
npm install --save-dev typescript-code-analyzer-pro
```

## Quick Start

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

## Command Options

### `tsa analyze`

- `-p, --path <path>` - Path to TypeScript project (default: current directory)
- `--perf` - Only analyze performance issues
- `--memory` - Only analyze memory leaks
- `--deps` - Only analyze dependencies
- `-o, --output <format>` - Output format (json, html, terminal)

### `tsa init`

Initializes configuration in your project. This creates a `tsa.config.json` file with your preferred settings.

## Output Formats

### Terminal Output
Displays results directly in the terminal with color-coded sections for:
- Performance Issues (🔵)
- Memory Leak Risks (🔴)
- Dependency Problems (🟣)
- Overall Summary (📝)

### HTML Report
Generates a beautiful, interactive HTML report with:
- Detailed issue descriptions
- Code locations
- Improvement suggestions
- Visual dependency graphs

### JSON Report
Outputs a structured JSON file for:
- CI/CD integration
- Custom processing
- Data analysis

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
  }
}
```

## Requirements

- Node.js >= 16
- TypeScript >= 4.0
- npm >= 7

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
