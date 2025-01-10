#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { analyze } from './commands/analyze.js';
import { init } from './commands/init.js';
import { backup } from './commands/backup.js';
import { createRequire } from 'module';
import updateNotifier from 'update-notifier';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

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
    .description('TypeScript Code Analyzer Pro - Advanced analysis and optimization tool')
    .version(version);

program
    .command('analyze')
    .description('Analyze TypeScript project for issues')
    .option('-p, --path <path>', 'Path to TypeScript project', process.cwd())
    .option('--perf', 'Only analyze performance')
    .option('--memory', 'Only analyze memory leaks')
    .option('--deps', 'Only analyze dependencies')
    .option('-o, --output <format>', 'Output format (json, html)', 'terminal')
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
    .action((source, options) => backup(source, options));

program.on('command:*', function () {
    console.error(chalk.red('Invalid command: %s'), program.args.join(' '));
    console.log('Use --help for a list of available commands.');
    process.exit(1);
});

program.parse(process.argv);
