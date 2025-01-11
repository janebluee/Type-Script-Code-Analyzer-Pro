import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { createWriteStream, createReadStream } from 'fs';
import { createGzip } from 'zlib';
import archiver, { Archiver } from 'archiver';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

interface BackupOptions {
    source: string;
    all?: boolean;
    format?: 'zip' | 'rar' | 'tar' | 'gz' | 'folder';
    destination?: string;
}

interface ArchiveStats {
    count: number;
    size: number;
}

export async function backup(source: string, options: BackupOptions) {
    const spinner = ora('Initializing backup...').start();
    
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultBackupDir = './backups';
        const backupDir = options.destination || defaultBackupDir;
        const format = options.format || 'zip';
        
        await fs.mkdir(backupDir, { recursive: true });

        const sourcePath = path.resolve(source);
        const sourceStats = await fs.stat(sourcePath);
        const sourceName = path.basename(sourcePath);

        spinner.text = `Backing up ${chalk.blue(sourcePath)}`;

        let backupPath: string;
        let itemsCount = 0;
        let totalSize = 0;

        switch (format) {
            case 'folder':
                backupPath = path.join(backupDir, `backup-${sourceName}-${timestamp}`);
                await backupAsFolder(sourcePath, backupPath, options.all);
                const stats = await getFolderStats(backupPath);
                itemsCount = stats.count;
                totalSize = stats.size;
                break;

            case 'zip':
                backupPath = path.join(backupDir, `backup-${timestamp}.zip`);
                const zipStats = await backupAsZip(sourcePath, backupPath, options.all);
                itemsCount = zipStats.count;
                totalSize = zipStats.size;
                break;

            case 'rar':
                try {
                    await execAsync('rar --version');
                } catch (error) {
                    throw new Error('WinRAR is not installed. Please install WinRAR to use RAR format.');
                }
                backupPath = path.join(backupDir, `backup-${timestamp}.rar`);
                await backupAsRar(sourcePath, backupPath, options.all);
                const rarStats = await fs.stat(backupPath);
                totalSize = rarStats.size;
                itemsCount = 1;
                break;

            case 'tar':
                backupPath = path.join(backupDir, `backup-${timestamp}.tar`);
                const tarStats = await backupAsTar(sourcePath, backupPath, options.all);
                itemsCount = tarStats.count;
                totalSize = tarStats.size;
                break;

            case 'gz':
                backupPath = path.join(backupDir, `backup-${timestamp}.tar.gz`);
                const gzStats = await backupAsGzip(sourcePath, backupPath, options.all);
                itemsCount = gzStats.count;
                totalSize = gzStats.size;
                break;

            default:
                throw new Error(`Unsupported format: ${format}`);
        }

        spinner.succeed(chalk.green(`Backup completed successfully! 📦`));
        console.log(chalk.cyan(`\nBackup details:`));
        console.log(`📍 Location: ${chalk.yellow(backupPath)}`);
        console.log(`📊 Size: ${chalk.yellow(formatSize(totalSize))}`);
        console.log(`🗂️  Items: ${chalk.yellow(itemsCount)} files/directories`);
        console.log(`📦 Format: ${chalk.yellow(format.toUpperCase())}`);

    } catch (error) {
        spinner.fail('Backup failed!');
        logger.error('Backup error:', error);
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

async function backupAsFolder(source: string, destination: string, all: boolean = false) {
    if (all) {
        const excludedDirs = ['node_modules', 'backups', '.git', 'dist'];
        await copyDirectory(source, destination, excludedDirs);
    } else {
        await copyDirectory(source, destination);
    }
}

async function backupAsZip(source: string, destination: string, all: boolean = false): Promise<ArchiveStats> {
    return new Promise(async (resolve, reject) => {
        const output = createWriteStream(destination);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        let fileCount = 0;
        archive.on('entry', () => fileCount++);

        archive.pipe(output);

        if (all) {
            archive.glob('**/*', {
                cwd: source,
                ignore: ['node_modules/**', 'backups/**', '.git/**', 'dist/**', '*.log'],
                dot: true
            });
        } else {
            const stats = await fs.stat(source);
            if (stats.isDirectory()) {
                archive.directory(source, path.basename(source));
            } else {
                archive.file(source, { name: path.basename(source) });
            }
        }

        output.on('close', () => {
            resolve({
                count: fileCount,
                size: archive.pointer()
            });
        });

        archive.on('error', reject);
        archive.finalize();
    });
}

async function backupAsRar(source: string, destination: string, all: boolean = false) {
    const excludeFlags = all ? '-x*\\node_modules\\* -x*\\backups\\* -x*\\.git\\* -x*\\dist\\*' : '';
    const command = `rar a -r ${excludeFlags} "${destination}" "${source}"`;
    await execAsync(command);
}

async function backupAsTar(source: string, destination: string, all: boolean = false): Promise<ArchiveStats> {
    return new Promise(async (resolve, reject) => {
        const output = createWriteStream(destination);
        const archive = archiver('tar');

        let fileCount = 0;
        archive.on('entry', () => fileCount++);

        archive.pipe(output);

        if (all) {
            archive.glob('**/*', {
                cwd: source,
                ignore: ['node_modules/**', 'backups/**', '.git/**', 'dist/**', '*.log'],
                dot: true
            });
        } else {
            const stats = await fs.stat(source);
            if (stats.isDirectory()) {
                archive.directory(source, path.basename(source));
            } else {
                archive.file(source, { name: path.basename(source) });
            }
        }

        output.on('close', () => {
            resolve({
                count: fileCount,
                size: archive.pointer()
            });
        });

        archive.on('error', reject);
        archive.finalize();
    });
}

async function backupAsGzip(source: string, destination: string, all: boolean = false): Promise<ArchiveStats> {
    const tarStats = await backupAsTar(source, destination + '.tmp', all);
    const gzip = createGzip();
    const input = createReadStream(destination + '.tmp');
    const output = createWriteStream(destination);

    await new Promise((resolve, reject) => {
        input.pipe(gzip).pipe(output)
            .on('finish', resolve)
            .on('error', reject);
    });

    await fs.unlink(destination + '.tmp');
    const finalStats = await fs.stat(destination);

    return {
        count: tarStats.count,
        size: finalStats.size
    };
}

async function copyDirectory(src: string, dest: string, excludeDirs: string[] = []) {
    const stats = await fs.stat(src);
    
    if (stats.isDirectory()) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src);

        for (const entry of entries) {
            if (excludeDirs.includes(entry)) continue;
            
            const srcPath = path.join(src, entry);
            const destPath = path.join(dest, entry);
            await copyDirectory(srcPath, destPath, excludeDirs);
        }
    } else {
        await fs.copyFile(src, dest);
    }
}

async function getFolderStats(folderPath: string): Promise<ArchiveStats> {
    let count = 0;
    let size = 0;

    async function processItem(itemPath: string) {
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
            const entries = await fs.readdir(itemPath);
            for (const entry of entries) {
                await processItem(path.join(itemPath, entry));
            }
        } else {
            count++;
            size += stats.size;
        }
    }

    await processItem(folderPath);
    return { count, size };
}

function formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}
