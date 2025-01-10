import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';
import { CodeAnalyzer } from './analyzer/CodeAnalyzer.js';
import logger from './utils/logger.js';

// Load environment variables
config();

const app = express();
const analyzer = new CodeAnalyzer();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('combined')); // HTTP request logging

// Routes
app.post('/api/analyze', async (req, res) => {
    try {
        const { projectPath } = req.body;
        
        if (!projectPath) {
            return res.status(400).json({
                success: false,
                error: 'Project path is required'
            });
        }

        logger.info(`Starting analysis for project: ${projectPath}`);
        const results = await analyzer.analyzeProject(projectPath);
        
        logger.info(`Analysis completed for project: ${projectPath}`);
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Analysis failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`TypeScript Code Analyzer Pro running on port ${PORT}`);
});
