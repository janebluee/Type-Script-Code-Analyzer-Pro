import fs from 'fs/promises';
import path from 'path';
import logger from './logger.js';

export async function generateReport(results: any, format: 'json' | 'html') {
    try {
        switch (format) {
            case 'json':
                await generateJsonReport(results);
                break;
            case 'html':
                await generateHtmlReport(results);
                break;
        }
    } catch (error) {
        logger.error('Error generating report:', error);
        throw error;
    }
}

async function generateJsonReport(results: any) {
    const content = JSON.stringify(results, null, 2);
    await fs.writeFile('tsa-report.json', content);
}

async function generateHtmlReport(results: any) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TypeScript Analyzer Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .issue {
            margin: 10px 0;
            padding: 10px;
            border-left: 4px solid #ff6b6b;
            background: #fff5f5;
        }
        .suggestion {
            color: #2f9e44;
            margin-top: 5px;
        }
        .location {
            color: #868e96;
            font-family: monospace;
        }
        .summary {
            background: #e3fafc;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>TypeScript Analyzer Report</h1>
        
        ${results.performance ? `
        <h2>Performance Issues</h2>
        ${results.performance.issues.map((issue: { description: any; location: any; suggestion: any; }) => `
            <div class="issue">
                <strong>${issue.description}</strong>
                <div class="location">${issue.location}</div>
                <div class="suggestion">💡 ${issue.suggestion}</div>
            </div>
        `).join('')}
        ` : ''}

        ${results.memoryLeaks ? `
        <h2>Memory Leak Risks</h2>
        ${results.memoryLeaks.potentialLeaks.map((leak: { description: any; location: any; suggestion: any; }) => `
            <div class="issue">
                <strong>${leak.description}</strong>
                <div class="location">${leak.location}</div>
                <div class="suggestion">💡 ${leak.suggestion}</div>
            </div>
        `).join('')}
        ` : ''}

        ${results.dependencies ? `
        <h2>Dependency Analysis</h2>
        ${results.dependencies.circularDependencies.length > 0 ? `
            <div class="issue">
                <strong>Circular Dependencies Found:</strong>
                <ul>
                    ${results.dependencies.circularDependencies.map((cycle: any[]) => `
                        <li>${cycle.join(' → ')}</li>
                    `).join('')}
                </ul>
            </div>
        ` : '<p>No circular dependencies found.</p>'}
        ` : ''}

        <div class="summary">
            <h2>Summary</h2>
            <p>Total Issues: ${results.summary.totalIssues}</p>
            <p>Critical Issues: ${results.summary.criticalIssues}</p>
            <p>Overall Health: ${results.summary.overallHealth}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;

    await fs.writeFile('tsa-report.html', html);
}
