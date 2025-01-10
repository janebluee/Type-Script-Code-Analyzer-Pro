import { Project, Node, SyntaxKind, SourceFile } from 'ts-morph';
import logger from '../utils/logger';

interface MemoryIssue {
    type: string;
    severity: 'low' | 'medium' | 'high';
    location: string;
    description: string;
    suggestion: string;
}

interface MemoryAnalysisResult {
    potentialLeaks: MemoryIssue[];
    severity: 'low' | 'medium' | 'high';
    suggestions: string[];
}

export class MemoryLeakDetector {
    public async detect(project: Project): Promise<MemoryAnalysisResult> {
        const issues: MemoryIssue[] = [];

        for (const sourceFile of project.getSourceFiles()) {
            // Check for event listener leaks
            issues.push(...this.detectEventListenerLeaks(sourceFile));
            
            // Check for closure leaks
            issues.push(...this.detectClosureLeaks(sourceFile));
            
            // Check for timer leaks
            issues.push(...this.detectTimerLeaks(sourceFile));
            
            // Check for large object accumulation
            issues.push(...this.detectObjectAccumulation(sourceFile));
        }

        const severity = this.calculateOverallSeverity(issues);
        const suggestions = this.generateSuggestions(issues);

        return {
            potentialLeaks: issues,
            severity,
            suggestions
        };
    }

    private detectEventListenerLeaks(sourceFile: SourceFile): MemoryIssue[] {
        const issues: MemoryIssue[] = [];
        
        sourceFile.forEachDescendant(node => {
            if (node.getKind() === SyntaxKind.CallExpression) {
                const call = node.asKind(SyntaxKind.CallExpression);
                const expression = call?.getExpression().getText();
                
                if (expression?.includes('addEventListener')) {
                    issues.push({
                        type: 'EventListenerLeak',
                        severity: 'medium',
                        location: `${sourceFile.getFilePath()}:${node.getStartLineNumber()}`,
                        description: 'Potential event listener leak detected',
                        suggestion: 'Ensure event listener is removed when component is destroyed'
                    });
                }
            }
        });

        return issues;
    }

    private detectClosureLeaks(sourceFile: SourceFile): MemoryIssue[] {
        const issues: MemoryIssue[] = [];
        
        sourceFile.forEachDescendant(node => {
            if (node.getKind() === SyntaxKind.ArrowFunction || 
                node.getKind() === SyntaxKind.FunctionDeclaration) {
                // Check for closures that capture large objects or arrays
                const text = node.getText();
                if (text.includes('this.') || text.includes('state') || text.includes('props')) {
                    issues.push({
                        type: 'ClosureLeak',
                        severity: 'low',
                        location: `${sourceFile.getFilePath()}:${node.getStartLineNumber()}`,
                        description: 'Potential closure leak detected',
                        suggestion: 'Be careful with closures that capture component state or props'
                    });
                }
            }
        });

        return issues;
    }

    private detectTimerLeaks(sourceFile: SourceFile): MemoryIssue[] {
        const issues: MemoryIssue[] = [];
        
        sourceFile.forEachDescendant(node => {
            if (node.getKind() === SyntaxKind.CallExpression) {
                const call = node.asKind(SyntaxKind.CallExpression);
                const expression = call?.getExpression().getText();
                
                if (expression?.includes('setInterval') || expression?.includes('setTimeout')) {
                    issues.push({
                        type: 'TimerLeak',
                        severity: 'medium',
                        location: `${sourceFile.getFilePath()}:${node.getStartLineNumber()}`,
                        description: 'Potential timer leak detected',
                        suggestion: 'Ensure timer is cleared when component unmounts'
                    });
                }
            }
        });

        return issues;
    }

    private detectObjectAccumulation(sourceFile: SourceFile): MemoryIssue[] {
        const issues: MemoryIssue[] = [];
        
        sourceFile.forEachDescendant(node => {
            if (node.getKind() === SyntaxKind.PropertyAccessExpression) {
                const text = node.getText();
                if (text.includes('.push') || text.includes('.unshift')) {
                    issues.push({
                        type: 'ObjectAccumulation',
                        severity: 'low',
                        location: `${sourceFile.getFilePath()}:${node.getStartLineNumber()}`,
                        description: 'Potential object accumulation detected',
                        suggestion: 'Consider implementing a cleanup mechanism for accumulated objects'
                    });
                }
            }
        });

        return issues;
    }

    private calculateOverallSeverity(issues: MemoryIssue[]): 'low' | 'medium' | 'high' {
        const highCount = issues.filter(i => i.severity === 'high').length;
        const mediumCount = issues.filter(i => i.severity === 'medium').length;
        
        if (highCount > 0) return 'high';
        if (mediumCount > 2) return 'medium';
        return 'low';
    }

    private generateSuggestions(issues: MemoryIssue[]): string[] {
        const suggestions = new Set<string>();
        
        issues.forEach(issue => {
            suggestions.add(issue.suggestion);
        });

        // Add general suggestions
        suggestions.add('Implement proper cleanup in component lifecycle methods');
        suggestions.add('Use weak references for cache implementations');
        suggestions.add('Consider using a memory profiler for detailed analysis');

        return Array.from(suggestions);
    }
}
