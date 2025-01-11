import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';

export async function init() {
    console.log(chalk.blue('\n🚀 Initializing TypeScript Analyzer configuration...\n'));

    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'includePaths',
                message: 'Which directories should be analyzed? (comma-separated)',
                default: 'src',
                filter: (input: string) => input.split(',').map(p => p.trim())
            },
            {
                type: 'confirm',
                name: 'analyzePerformance',
                message: 'Enable performance analysis?',
                default: true
            },
            {
                type: 'confirm',
                name: 'analyzeMemory',
                message: 'Enable memory leak detection?',
                default: true
            },
            {
                type: 'confirm',
                name: 'analyzeDependencies',
                message: 'Enable dependency analysis?',
                default: true
            },
            {
                type: 'list',
                name: 'reportFormat',
                message: 'Default report format?',
                choices: ['terminal', 'json', 'html'],
                default: 'terminal'
            }
        ]);

        const config = {
            version: '1.0.0',
            include: answers.includePaths,
            analysis: {
                performance: answers.analyzePerformance,
                memory: answers.analyzeMemory,
                dependencies: answers.analyzeDependencies
            },
            reporting: {
                format: answers.reportFormat,
                output: './tsa-reports'
            }
        };

        // Write config file
        await fs.writeFile(
            path.join(process.cwd(), 'tsa.config.json'),
            JSON.stringify(config, null, 2)
        );

        console.log(chalk.green('\n✨ Configuration file created successfully!'));
        console.log(chalk.gray('\nYou can now run:'));
        console.log(chalk.blue('  tsa analyze'));
        console.log(chalk.gray('to start analyzing your TypeScript code.'));

    } catch (error) {
        logger.error('Init error:', error);
        console.error(chalk.red('\nError creating configuration:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
