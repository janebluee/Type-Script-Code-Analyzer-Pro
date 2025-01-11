import ora from 'ora';
import chalk from 'chalk';
import { CodeAnalyzer } from '../analyzer/CodeAnalyzer.js';
import { generateReport } from '../utils/report.js';
import logger from '../utils/logger.js';

interface AnalyzeOptions {
    path: string;
    perf?: boolean;
    memory?: boolean;
    deps?: boolean;
    output?: 'json' | 'html' | 'terminal';
}

export async function analyze(options: AnalyzeOptions) {
    const spinner = ora('Initializing analysis...').start();
    
    try {
        const analyzer = new CodeAnalyzer();
        spinner.text = `Analyzing TypeScript project at ${chalk.blue(options.path)}`;
        const results = await analyzer.analyzeProject(options.path);
        
        const filteredResults = {
            ...(options.perf && { performance: results.performance }),
            ...(options.memory && { memoryLeaks: results.memoryLeaks }),
            ...(options.deps && { dependencies: results.dependencies }),
            ...(!options.perf && !options.memory && !options.deps && results),
            summary: results.summary
        };

        spinner.succeed('Analysis complete!');
        
        switch (options.output) {
            case 'json':
                await generateReport(filteredResults, 'json');
                console.log(chalk.green('\nJSON report generated: tsa-report.json'));
                break;
            
            case 'html':
                await generateReport(filteredResults, 'html');
                console.log(chalk.green('\nHTML report generated: tsa-report.html'));
                break;
            
            default:
                console.log('\n' + chalk.bold('📊 Analysis Results:'));
                
                if (filteredResults.performance) {
                    console.log('\n' + chalk.blue.bold('Performance Issues:'));
                    filteredResults.performance.issues.forEach(issue => {
                        console.log(chalk.yellow(`  ⚠️  ${issue.description}`));
                        console.log(`     ${chalk.gray(issue.location)}`);
                        console.log(`     ${chalk.green('Suggestion:')} ${issue.suggestion}\n`);
                    });
                }

                if (filteredResults.memoryLeaks) {
                    console.log('\n' + chalk.red.bold('Memory Leak Risks:'));
                    filteredResults.memoryLeaks.potentialLeaks.forEach(leak => {
                        console.log(chalk.yellow(`  🔍 ${leak.description}`));
                        console.log(`     ${chalk.gray(leak.location)}`);
                        console.log(`     ${chalk.green('Suggestion:')} ${leak.suggestion}\n`);
                    });
                }

                if (filteredResults.dependencies) {
                    console.log('\n' + chalk.magenta.bold('Dependency Analysis:'));
                    if (filteredResults.dependencies.circularDependencies.length > 0) {
                        console.log(chalk.yellow('  ⭕ Circular Dependencies Found:'));
                        filteredResults.dependencies.circularDependencies.forEach(cycle => {
                            console.log(`     ${cycle.join(' → ')}`);
                        });
                    }
                }

                console.log('\n' + chalk.bold('📝 Summary:'));
                console.log(chalk.blue(`  Total Issues: ${filteredResults.summary.totalIssues}`));
                console.log(chalk.red(`  Critical Issues: ${filteredResults.summary.criticalIssues}`));
                console.log(chalk.yellow(`  Overall Health: ${filteredResults.summary.overallHealth}`));
        }

    } catch (error) {
        spinner.fail('Analysis failed!');
        logger.error('Analysis error:', error);
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
