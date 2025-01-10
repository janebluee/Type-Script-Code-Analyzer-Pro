import { Project, Node, SyntaxKind, FunctionDeclaration, MethodDeclaration, SourceFile } from 'ts-morph';
import logger from '../utils/logger.js';

interface PerformanceIssue {
    type: 'loop' | 'memory' | 'complexity';
    severity: 'low' | 'medium' | 'high';
    location: string;
    description: string;
    suggestion: string;
    code?: string;
}

interface PerformanceMetrics {
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    linesOfCode: number;
}

interface PerformanceAnalysisResult {
    issues: PerformanceIssue[];
    metrics: PerformanceMetrics;
    recommendations: string[];
}

export class PerformanceAnalyzer {
    public async analyze(project: Project): Promise<PerformanceAnalysisResult> {
        logger.info('Starting performance analysis');
        const issues: PerformanceIssue[] = [];
        const metrics: PerformanceMetrics = {
            cyclomaticComplexity: 0,
            maintainabilityIndex: 0,
            linesOfCode: 0
        };

        for (const sourceFile of project.getSourceFiles()) {
            try {
                // Analyze loops
                issues.push(...this.analyzeLoops(sourceFile));
                
                // Analyze memory usage
                issues.push(...this.analyzeMemoryUsage(sourceFile));
                
                // Analyze function complexity
                const complexityResults = this.analyzeFunctionComplexity(sourceFile);
                issues.push(...complexityResults.issues);
                metrics.cyclomaticComplexity += complexityResults.complexity;
                
                // Calculate lines of code
                metrics.linesOfCode += sourceFile.getFullText().split('\n').length;
            } catch (error) {
                logger.error(`Error analyzing file ${sourceFile.getFilePath()}:`, error);
            }
        }

        // Calculate maintainability index
        metrics.maintainabilityIndex = this.calculateMaintainabilityIndex(metrics);

        return {
            issues,
            metrics,
            recommendations: this.generateRecommendations(issues)
        };
    }

    private analyzeLoops(sourceFile: SourceFile): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];
        
        sourceFile.forEachDescendant(node => {
            if (node.getKind() === SyntaxKind.ForStatement || 
                node.getKind() === SyntaxKind.ForInStatement || 
                node.getKind() === SyntaxKind.ForOfStatement) {
                
                // Check for nested loops
                let parent = node.getParent();
                while (parent) {
                    if (parent.getKind() === SyntaxKind.ForStatement || 
                        parent.getKind() === SyntaxKind.ForInStatement || 
                        parent.getKind() === SyntaxKind.ForOfStatement) {
                        issues.push({
                            type: 'loop',
                            severity: 'high',
                            location: `${sourceFile.getFilePath()}:${node.getStartLineNumber()}`,
                            description: 'Nested loop detected - potential performance issue',
                            suggestion: 'Consider restructuring to avoid nested loops or use array methods',
                            code: node.getText()
                        });
                        break;
                    }
                    parent = parent.getParent();
                }
            }
        });

        return issues;
    }

    private analyzeMemoryUsage(sourceFile: SourceFile): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];
        
        sourceFile.forEachDescendant(node => {
            // Check for large array literals
            if (node.getKind() === SyntaxKind.ArrayLiteralExpression) {
                const elements = node.getChildren().length;
                if (elements > 1000) {
                    issues.push({
                        type: 'memory',
                        severity: 'medium',
                        location: `${sourceFile.getFilePath()}:${node.getStartLineNumber()}`,
                        description: 'Large array literal detected',
                        suggestion: 'Consider loading large arrays dynamically or paginating',
                        code: node.getText().substring(0, 100) + '...'
                    });
                }
            }

            // Check for memory-intensive operations
            if (node.getKind() === SyntaxKind.CallExpression) {
                const call = node.getText();
                if (call.includes('concat') || call.includes('splice')) {
                    issues.push({
                        type: 'memory',
                        severity: 'low',
                        location: `${sourceFile.getFilePath()}:${node.getStartLineNumber()}`,
                        description: 'Memory-intensive array operation detected',
                        suggestion: 'Consider using more efficient array operations',
                        code: call
                    });
                }
            }
        });

        return issues;
    }

    private analyzeFunctionComplexity(sourceFile: SourceFile): { issues: PerformanceIssue[], complexity: number } {
        const issues: PerformanceIssue[] = [];
        let totalComplexity = 0;

        const analyzeFunctionNode = (node: FunctionDeclaration | MethodDeclaration) => {
            let complexity = 1; // Base complexity

            // Count decision points
            node.forEachDescendant(child => {
                switch (child.getKind()) {
                    case SyntaxKind.IfStatement:
                    case SyntaxKind.ForStatement:
                    case SyntaxKind.WhileStatement:
                    case SyntaxKind.CaseClause:
                    case SyntaxKind.CatchClause:
                    case SyntaxKind.ConditionalExpression: // ternary
                    case SyntaxKind.BinaryExpression: // logical && and ||
                        if (child.getKind() === SyntaxKind.BinaryExpression) {
                            const operator = child.getText().match(/&&|\|\|/);
                            if (operator) complexity++;
                        } else {
                            complexity++;
                        }
                        break;
                }
            });

            if (complexity > 10) {
                issues.push({
                    type: 'complexity',
                    severity: complexity > 20 ? 'high' : 'medium',
                    location: `${sourceFile.getFilePath()}:${node.getStartLineNumber()}`,
                    description: `High cyclomatic complexity (${complexity})`,
                    suggestion: 'Consider breaking down this function into smaller functions',
                    code: node.getName() || 'anonymous function'
                });
            }

            return complexity;
        };

        sourceFile.forEachDescendant(node => {
            if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
                totalComplexity += analyzeFunctionNode(node);
            }
        });

        return { issues, complexity: totalComplexity };
    }

    private calculateMaintainabilityIndex(metrics: PerformanceMetrics): number {
        // Simplified maintainability index calculation
        const HV = Math.log(metrics.linesOfCode) * 5.2;
        const CC = metrics.cyclomaticComplexity * 0.23;
        const maintainabilityIndex = Math.max(0, (171 - HV - CC) * 100 / 171);
        return Math.round(maintainabilityIndex);
    }

    private generateRecommendations(issues: PerformanceIssue[]): string[] {
        const recommendations: string[] = [];
        
        // Group issues by type
        const issuesByType = issues.reduce((acc, issue) => {
            acc[issue.type] = acc[issue.type] || [];
            acc[issue.type].push(issue);
            return acc;
        }, {} as Record<string, PerformanceIssue[]>);

        // Generate recommendations based on patterns
        if (issuesByType.loop?.length > 0) {
            recommendations.push(
                'Consider using array methods (map, filter, reduce) instead of loops where possible',
                'Review nested loops for potential optimization opportunities'
            );
        }

        if (issuesByType.memory?.length > 0) {
            recommendations.push(
                'Implement pagination for large data sets',
                'Use memory-efficient data structures for large collections'
            );
        }

        if (issuesByType.complexity?.length > 0) {
            recommendations.push(
                'Break down complex functions into smaller, more manageable pieces',
                'Consider implementing a service layer to better separate concerns'
            );
        }

        return recommendations;
    }
}
