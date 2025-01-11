import { Project, SourceFile } from 'ts-morph';
import { PerformanceAnalyzer } from './PerformanceAnalyzer.js';
import { MemoryLeakDetector } from './MemoryLeakDetector.js';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

interface AnalysisResult {
    performance: {
        issues: any[];
        recommendations: string[];
        metrics: {
            cyclomaticComplexity: number;
            maintainabilityIndex: number;
            linesOfCode: number;
        };
    };
    memoryLeaks: {
        potentialLeaks: any[];
        severity: 'low' | 'medium' | 'high';
        suggestions: string[];
    };
    dependencies: {
        graph: any;
        circularDependencies: string[][];
        metrics: {
            totalFiles: number;
            averageDependencies: number;
            maxDependencies: number;
        };
    };
    summary: {
        totalIssues: number;
        criticalIssues: number;
        overallHealth: 'good' | 'moderate' | 'poor';
        timestamp: string;
    };
}

export class CodeAnalyzer {
    private project: Project;
    private performanceAnalyzer: PerformanceAnalyzer;
    private memoryLeakDetector: MemoryLeakDetector;
    private dependencyAnalyzer: DependencyAnalyzer;

    constructor() {
        this.project = new Project();
        this.performanceAnalyzer = new PerformanceAnalyzer();
        this.memoryLeakDetector = new MemoryLeakDetector();
        this.dependencyAnalyzer = new DependencyAnalyzer();
    }

    public async analyzeProject(projectPath: string): Promise<AnalysisResult> {
        try {
            // Validate project path
            if (!fs.existsSync(projectPath)) {
                throw new Error(`Project path does not exist: ${projectPath}`);
            }

            // Find tsconfig.json
            const tsconfigPath = this.findTsConfig(projectPath);
            if (!tsconfigPath) {
                throw new Error('No tsconfig.json found in project');
            }

            logger.info(`Using tsconfig from: ${tsconfigPath}`);
            this.project = new Project({
                tsConfigFilePath: tsconfigPath
            });

            // Run all analyzers
            logger.info('Starting performance analysis...');
            const performanceResults = await this.performanceAnalyzer.analyze(this.project);

            logger.info('Starting memory leak detection...');
            const memoryResults = await this.memoryLeakDetector.detect(this.project);

            logger.info('Starting dependency analysis...');
            const dependencyResults = await this.dependencyAnalyzer.analyze(this.project);

            // Generate summary
            const summary = this.generateSummary({
                performance: performanceResults,
                memoryLeaks: memoryResults,
                dependencies: dependencyResults
            });

            return {
                performance: performanceResults,
                memoryLeaks: memoryResults,
                dependencies: dependencyResults,
                summary
            };
        } catch (error) {
            logger.error('Analysis failed:', error);
            throw error;
        }
    }

    private findTsConfig(projectPath: string): string | null {
        let currentPath = projectPath;
        while (currentPath !== path.parse(currentPath).root) {
            const tsconfigPath = path.join(currentPath, 'tsconfig.json');
            if (fs.existsSync(tsconfigPath)) {
                return tsconfigPath;
            }
            currentPath = path.dirname(currentPath);
        }
        return null;
    }

    private generateSummary(results: Omit<AnalysisResult, 'summary'>): AnalysisResult['summary'] {
        const totalIssues = 
            results.performance.issues.length +
            results.memoryLeaks.potentialLeaks.length;

        const criticalIssues = 
            results.performance.issues.filter(i => i.severity === 'high').length +
            results.memoryLeaks.potentialLeaks.filter(i => i.severity === 'high').length;

        let overallHealth: 'good' | 'moderate' | 'poor' = 'good';
        if (criticalIssues > 0) {
            overallHealth = 'poor';
        } else if (totalIssues > 10) {
            overallHealth = 'moderate';
        }

        return {
            totalIssues,
            criticalIssues,
            overallHealth,
            timestamp: new Date().toISOString()
        };
    }
}
