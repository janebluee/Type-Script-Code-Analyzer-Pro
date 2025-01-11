#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { analyze } from './commands/analyze.js';
import { init } from './commands/init.js';
import { backup } from './commands/backup.js';
import { template } from './commands/template.js';
import { SmartCommandManager } from './commands/smart.js';
import { deployCommand } from './commands/deploy.js';
import { createRequire } from 'module';
import updateNotifier from 'update-notifier';

const require = createRequire(import.meta.url);
const { version, name } = require('../package.json');

const program = new Command();
const smartCommandManager = new SmartCommandManager();

const pkg = { name: 'typescript-code-analyzer-pro', version };
updateNotifier({ pkg }).notify();

console.log(
  chalk.cyan(
    figlet.textSync('TSAP', {
      font: 'Standard',
      horizontalLayout: 'full'
    })
  )
);

program
  .name('tsa')
  .version(version)
  .description('TypeScript Code Analyzer Pro - Advanced analysis and optimization tool');

program
  .command('analyze')
  .description('Analyze TypeScript project for issues')
  .option('-p, --path <path>', 'Path to TypeScript project', process.cwd())
  .option('--perf', 'Only analyze performance')
  .option('--memory', 'Only analyze memory leaks')
  .option('--deps', 'Only analyze dependencies')
  .option('-o, --output <format>', 'Output format (json, html, terminal)', 'terminal')
  .action(analyze);

program
  .command('init')
  .description('Initialize configuration in your project')
  .action(init);

program
  .command('backup <source>')
  .description('Backup specified files or directories')
  .option('--all', 'Backup all project files (excludes node_modules, backups, etc.)')
  .option('-f, --format <format>', 'Backup format (zip, rar, tar, gz, folder)', 'zip')
  .option('-d, --destination <path>', 'Backup destination directory')
  .action(backup);

program
  .command('template')
  .description('Create new TypeScript project from template')
  .argument('<name>', 'Project name')
  .option('-t, --template <template>', 'Template to use', 'react-ts')
  .option('-p, --path <path>', 'Project path')
  .option('-d, --database <database>', 'Database to use (prisma, typeorm, mongoose, sequelize)')
  .option('-a, --auth', 'Add authentication support')
  .option('--api', 'Add API support')
  .option('--pwa', 'Add PWA support')
  .option('--docker', 'Add Docker support')
  .option('--ci', 'Add CI/CD configuration')
  .option('--testing', 'Add testing configuration')
  .action(template);

program
  .command('deploy')
  .description('Deploy your TypeScript project to various platforms')
  .option('-p, --platform <platform>', 'Deployment platform (vercel/netlify/aws/azure/gcp)')
  .option('-r, --region <region>', 'Deployment region (for AWS)')
  .option('-e, --environment <env>', 'Deployment environment (production/staging/development)')
  .option('-b, --branch <branch>', 'Git branch to deploy')
  .action(deployCommand);

program
  .command('smart')
  .description('Smart command interface with auto-completion and history')
  .action(() => smartCommandManager.handleSmartMode());

program
  .command('alias <alias> <command>')
  .description('Create command alias')
  .action((alias, command) => smartCommandManager.createAlias(alias, command));

program
  .command('history')
  .description('Show command history')
  .action(() => smartCommandManager.showHistory());

try {
  await program.parseAsync();
} catch (error) {
  console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}
