import { Command } from 'commander';
import inquirer from 'inquirer';
import inquirerPrompt from 'inquirer-autocomplete-prompt';
import Fuse from 'fuse.js';
import Conf from 'conf';
import chalk from 'chalk';

type AutocompleteQuestionOptions = {
    type: 'autocomplete';
    name: string;
    message: string;
    source: (answersSoFar: any, input: string) => Promise<Array<{
        name: string;
        description: string;
    }>>;
};

type CommandType = {
    name: string;
    description: string;
};

const config = new Conf<{
    commandHistory: string[];
    aliases: Record<string, string>;
}>({
    projectName: 'typescript-analyzer-pro',
    defaults: {
        commandHistory: [],
        aliases: {}
    }
});

const defaultCommands: CommandType[] = [
    { name: 'analyze', description: 'Analyze TypeScript project for issues' },
    { name: 'init', description: 'Initialize configuration in your project' },
    { name: 'backup', description: 'Backup specified files or directories' }
];

const fuse = new Fuse(defaultCommands, {
    keys: ['name', 'description'],
    threshold: 0.4
});

export class SmartCommandManager {
    private history: string[] = config.get('commandHistory');
    private aliases: Record<string, string> = config.get('aliases');

    async registerSmartCommands(program: Command): Promise<void> {
        inquirer.registerPrompt('autocomplete', inquirerPrompt);

        program
            .command('smart')
            .description('Smart command interface with auto-completion and history')
            .action(async () => {
                await this.handleSmartMode();
            });

        program
            .command('alias <alias> <command>')
            .description('Create command alias')
            .action(this.createAlias.bind(this));

        program
            .command('history')
            .description('Show command history')
            .action(this.showHistory.bind(this));
    }

    async handleSmartMode(): Promise<void> {
        type Answer = { command: string };
        
        const { command } = await inquirer.prompt<Answer>([{
            type: 'autocomplete',
            name: 'command',
            message: 'Select or type a command:',
            source: async (_: any, input: string = '') => {
                const searchResults = input ? fuse.search(input) : defaultCommands;
                const suggestions = searchResults.map(result => 
                    'item' in result ? result.item : result
                );
                
                const historyMatches = this.history
                    .filter(cmd => !input || cmd.includes(input))
                    .map(cmd => ({ name: cmd, description: '(from history)' }));

                return [...suggestions, ...historyMatches];
            }
        } as AutocompleteQuestionOptions]);

        await this.executeCommand(command);
    }

    async executeCommand(commandName: string): Promise<void> {
        try {
            const resolvedCommand = this.aliases[commandName] || commandName;
            this.addToHistory(resolvedCommand);

            const commandParts = resolvedCommand.split(' ');
            const baseCommand = commandParts[0];
            const args = commandParts.slice(1);

            if (defaultCommands.some(cmd => cmd.name === baseCommand)) {
                console.log(chalk.blue(`Executing: ${resolvedCommand}`));
                await this.executeBuiltInCommand(baseCommand, args);
            } else {
                console.log(chalk.red(`Unknown command: ${baseCommand}`));
            }
        } catch (error) {
            console.error(chalk.red('Error executing command:'), error instanceof Error ? error.message : 'Unknown error');
        }
    }

    async executeBuiltInCommand(command: string, args: string[]): Promise<void> {
        const options = this.parseArgs(args);
        
        switch (command) {
            case 'analyze':
                const { analyze } = await import('./analyze.js');
                await analyze({ path: process.cwd(), ...options });
                break;
            case 'init':
                const { init } = await import('./init.js');
                await init();
                break;
            case 'backup':
                const { backup } = await import('./backup.js');
                const source = args[0] || process.cwd();
                await backup(source, {
                    source,
                    ...options
                });
                break;
        }
    }

    parseArgs(args: string[]): Record<string, unknown> {
        const options: Record<string, unknown> = {};
        for (let i = 0; i < args.length; i++) {
            if (args[i].startsWith('--')) {
                const key = args[i].slice(2);
                const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
                options[key] = value;
                if (typeof value === 'string') i++;
            }
        }
        return options;
    }

    createAlias(alias: string, command: string): void {
        this.aliases[alias] = command;
        config.set('aliases', this.aliases);
        console.log(chalk.green(`Alias created: ${alias} -> ${command}`));
    }

    showHistory(): void {
        if (this.history.length === 0) {
            console.log(chalk.yellow('No command history available'));
            return;
        }

        console.log(chalk.blue('\nCommand History:'));
        this.history.forEach((cmd, index) => {
            console.log(chalk.white(`${index + 1}. ${cmd}`));
        });
    }

    addToHistory(command: string): void {
        this.history = [command, ...this.history.filter(cmd => cmd !== command)].slice(0, 50);
        config.set('commandHistory', this.history);
    }
}
