import { Project, SourceFile } from 'ts-morph';
import logger from '../utils/logger.js';
import path from 'path';

interface DependencyNode {
    name: string;
    dependencies: string[];
    weight: number;
}

interface DependencyAnalysisResult {
    graph: any;
    circularDependencies: string[][];
    metrics: {
        totalFiles: number;
        averageDependencies: number;
        maxDependencies: number;
    };
}

export class DependencyAnalyzer {
    private dependencyGraph: Map<string, DependencyNode>;

    constructor() {
        this.dependencyGraph = new Map();
    }

    public async analyze(project: Project): Promise<DependencyAnalysisResult> {
        logger.info('Building dependency graph...');
        this.buildDependencyGraph(project);
        
        logger.info('Detecting circular dependencies...');
        const circular = this.detectCircularDependencies();
        
        logger.info('Calculating dependency metrics...');
        const metrics = this.calculateMetrics();

        return {
            graph: this.exportGraph(),
            circularDependencies: circular,
            metrics
        };
    }

    private buildDependencyGraph(project: Project) {
        for (const sourceFile of project.getSourceFiles()) {
            const filePath = sourceFile.getFilePath();
            const imports = sourceFile.getImportDeclarations();
            
            const dependencies = imports.map(imp => {
                const moduleSpecifier = imp.getModuleSpecifierValue();
                return this.resolveModulePath(moduleSpecifier, filePath);
            }).filter(dep => dep !== null) as string[];

            this.dependencyGraph.set(filePath, {
                name: filePath,
                dependencies: dependencies,
                weight: dependencies.length
            });
        }
    }

    private resolveModulePath(moduleSpecifier: string, currentPath: string): string | null {
        if (moduleSpecifier.startsWith('.')) {
            const dir = path.dirname(currentPath);
            return path.resolve(dir, moduleSpecifier);
        }
        // For now, we'll skip node_modules dependencies
        if (moduleSpecifier.startsWith('@') || !moduleSpecifier.includes('/')) {
            return null;
        }
        return moduleSpecifier;
    }

    private detectCircularDependencies(): string[][] {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const circular: string[][] = [];

        const dfs = (node: string, path: string[]) => {
            visited.add(node);
            recursionStack.add(node);

            const dependencies = this.dependencyGraph.get(node)?.dependencies || [];
            for (const dep of dependencies) {
                if (!visited.has(dep)) {
                    dfs(dep, [...path, dep]);
                } else if (recursionStack.has(dep)) {
                    const cycle = path.slice(path.indexOf(dep));
                    circular.push(cycle);
                }
            }

            recursionStack.delete(node);
        };

        for (const [node] of this.dependencyGraph) {
            if (!visited.has(node)) {
                dfs(node, [node]);
            }
        }

        return circular;
    }

    private calculateMetrics() {
        let totalDependencies = 0;
        let maxDependencies = 0;

        for (const [, node] of this.dependencyGraph) {
            const depCount = node.dependencies.length;
            totalDependencies += depCount;
            maxDependencies = Math.max(maxDependencies, depCount);
        }

        return {
            totalFiles: this.dependencyGraph.size,
            averageDependencies: this.dependencyGraph.size > 0 
                ? totalDependencies / this.dependencyGraph.size 
                : 0,
            maxDependencies
        };
    }

    private exportGraph() {
        return Array.from(this.dependencyGraph.entries()).map(([key, value]) => ({
            id: key,
            dependencies: value.dependencies,
            weight: value.weight
        }));
    }
}
