import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function createCliLauncher() {
    const binDir = join(projectRoot, 'bin');
    const cliContent = `#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = pathToFileURL(join(__dirname, '..', 'dist', 'cli.js')).href;

import(cliPath).catch((error) => {
    console.error('Error loading CLI:', error);
    process.exit(1);
});
`;

    try {
        await mkdir(binDir, { recursive: true });
        await writeFile(join(binDir, 'cli.js'), cliContent, 'utf8');
        console.log('CLI launcher created successfully');
    } catch (error) {
        console.error('Error creating CLI launcher:', error);
        process.exit(1);
    }
}

createCliLauncher();
