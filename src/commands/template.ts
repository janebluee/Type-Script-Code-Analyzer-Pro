import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

interface TemplateOptions {
    name: string;
    template?: string;
    path?: string;
    database?: string;
    auth?: boolean;
    api?: boolean;
    pwa?: boolean;
    docker?: boolean;
    ci?: boolean;
    testing?: boolean;
}

interface PackageBasedTemplate {
    name: string;
    packages: string[];
    devPackages: string[];
    command?: never;
}

interface CommandBasedTemplate {
    name: string;
    command: string;
    packages?: never;
    devPackages?: never;
}

type TemplateConfig = PackageBasedTemplate | CommandBasedTemplate;

const templates: Record<string, TemplateConfig> = {
    'react-ts': {
        name: 'React + TypeScript',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            'typescript', '@types/node'
        ],
        devPackages: [
            'vite', '@vitejs/plugin-react', 'eslint',
            '@typescript-eslint/parser', '@typescript-eslint/eslint-plugin'
        ]
    },
    'next-ts': {
        name: 'Next.js + TypeScript',
        command: 'npx create-next-app@latest --typescript --tailwind --eslint --app --src-dir --import-alias'
    },
    'vue-ts': {
        name: 'Vue.js + TypeScript',
        command: 'npm init vue@latest -- --typescript --jsx --router --pinia --vitest --cypress --eslint --prettier'
    },
    'nuxt-ts': {
        name: 'Nuxt.js + TypeScript',
        command: 'npx nuxi@latest init --typescript --git --prettier --eslint'
    },
    'svelte-ts': {
        name: 'SvelteKit + TypeScript',
        command: 'npm create svelte@latest -- --typescript --prettier --eslint --playwright --vitest'
    },
    'solid-ts': {
        name: 'SolidJS + TypeScript',
        command: 'npx degit solidjs/templates/ts-starter'
    },
    'qwik-ts': {
        name: 'Qwik + TypeScript',
        command: 'npm create qwik@latest -- --typescript'
    },
    'react-tailwind': {
        name: 'React + Tailwind CSS + DaisyUI',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            'typescript', '@types/node', '@heroicons/react'
        ],
        devPackages: [
            'tailwindcss', 'postcss', 'autoprefixer', 'daisyui',
            'vite', '@vitejs/plugin-react'
        ]
    },
    'react-mui': {
        name: 'React + Material UI + Emotion',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled',
            '@mui/x-data-grid', '@mui/x-date-pickers', 'date-fns'
        ],
        devPackages: [
            'typescript', '@types/node', 'vite', '@vitejs/plugin-react'
        ]
    },
    'react-chakra': {
        name: 'React + Chakra UI + Framer Motion',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            '@chakra-ui/react', '@chakra-ui/icons', '@emotion/react', '@emotion/styled',
            'framer-motion', '@chakra-ui/theme-tools'
        ],
        devPackages: [
            'typescript', '@types/node', 'vite', '@vitejs/plugin-react'
        ]
    },
    'react-mantine': {
        name: 'React + Mantine UI',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            '@mantine/core', '@mantine/hooks', '@mantine/form', '@mantine/notifications',
            '@mantine/dates', '@mantine/dropzone', '@mantine/carousel'
        ],
        devPackages: [
            'typescript', '@types/node', 'vite', '@vitejs/plugin-react'
        ]
    },
    'react-shadcn': {
        name: 'React + shadcn/ui + Radix UI',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            '@radix-ui/react-dialog', '@radix-ui/react-slot',
            'class-variance-authority', 'clsx', 'tailwind-merge'
        ],
        devPackages: [
            'typescript', '@types/node', 'tailwindcss',
            'vite', '@vitejs/plugin-react'
        ]
    },
    'react-bootstrap': {
        name: 'React + Bootstrap',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            'react-bootstrap', 'bootstrap', 'react-icons'
        ],
        devPackages: [
            'typescript', '@types/node', 'sass',
            'vite', '@vitejs/plugin-react'
        ]
    },
    'react-redux': {
        name: 'React + Redux Toolkit + RTK Query',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            '@reduxjs/toolkit', 'react-redux', '@types/react-redux',
            'redux-persist', 'redux-thunk'
        ],
        devPackages: [
            'typescript', '@types/node', 'vite', '@vitejs/plugin-react',
            'redux-devtools-extension'
        ]
    },
    'react-query': {
        name: 'React + TanStack Query + Axios',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            '@tanstack/react-query', '@tanstack/react-query-devtools',
            'axios', '@types/axios'
        ],
        devPackages: [
            'typescript', '@types/node', 'vite', '@vitejs/plugin-react'
        ]
    },
    'react-zustand': {
        name: 'React + Zustand + Immer',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            'zustand', 'immer', 'zod'
        ],
        devPackages: [
            'typescript', '@types/node', 'vite', '@vitejs/plugin-react'
        ]
    },
    'react-jotai': {
        name: 'React + Jotai + XState',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            'jotai', 'xstate', '@xstate/react'
        ],
        devPackages: [
            'typescript', '@types/node', 'vite', '@vitejs/plugin-react'
        ]
    },
    'react-recoil': {
        name: 'React + Recoil',
        packages: [
            'react', 'react-dom', '@types/react', '@types/react-dom',
            'recoil', 'recoil-persist'
        ],
        devPackages: [
            'typescript', '@types/node', 'vite', '@vitejs/plugin-react'
        ]
    },
    'express-ts': {
        name: 'Express + TypeScript + Prisma',
        packages: [
            'express', '@types/express', 'cors', '@types/cors',
            'dotenv', 'helmet', 'morgan', '@types/morgan',
            '@prisma/client', 'bcrypt', '@types/bcrypt',
            'jsonwebtoken', '@types/jsonwebtoken',
            'zod', 'express-rate-limit', 'compression'
        ],
        devPackages: [
            'typescript', '@types/node', 'ts-node', 'nodemon',
            'prisma', 'jest', '@types/jest', 'ts-jest',
            'supertest', '@types/supertest'
        ]
    },
    'nest-ts': {
        name: 'NestJS + TypeScript + Swagger',
        command: 'npx @nestjs/cli new --package-manager npm --language typescript --strict'
    },
    'fastify-ts': {
        name: 'Fastify + TypeScript + Prisma',
        packages: [
            'fastify', '@fastify/cors', '@fastify/helmet',
            '@fastify/swagger', '@fastify/jwt', '@fastify/compress',
            '@prisma/client', 'zod'
        ],
        devPackages: [
            'typescript', '@types/node', 'ts-node', 'nodemon',
            'prisma', 'jest', '@types/jest', 'ts-jest'
        ]
    },
    'koa-ts': {
        name: 'Koa + TypeScript + TypeORM',
        packages: [
            'koa', '@types/koa', 'koa-router', '@types/koa-router',
            'koa-bodyparser', '@types/koa-bodyparser',
            'typeorm', 'reflect-metadata', 'pg', '@types/pg'
        ],
        devPackages: [
            'typescript', '@types/node', 'ts-node', 'nodemon',
            'jest', '@types/jest', 'ts-jest'
        ]
    },
    't3-stack': {
        name: 'T3 Stack (Next.js + tRPC + Prisma)',
        command: 'npx create-t3-app@latest --typescript --tailwind --prisma --trpc --nextAuth --CI'
    },
    'mern-ts': {
        name: 'MERN Stack + TypeScript + GraphQL',
        packages: [
            'express', '@types/express', 'mongoose', '@types/mongoose',
            'react', 'react-dom', '@types/react', '@types/react-dom',
            'apollo-server-express', 'type-graphql', 'class-validator',
            '@apollo/client', 'graphql'
        ],
        devPackages: [
            'typescript', '@types/node', 'ts-node', 'nodemon',
            'vite', '@vitejs/plugin-react'
        ]
    },
    'blitz-ts': {
        name: 'Blitz.js Full Stack',
        command: 'npx blitz new --typescript --tailwind --prettier --eslint --jest'
    },
    'redwood-ts': {
        name: 'RedwoodJS Full Stack',
        command: 'yarn create redwood-app --typescript --yarn'
    },
    'jest-ts': {
        name: 'Jest + Testing Library',
        packages: ['typescript'],
        devPackages: [
            'jest', '@types/jest', 'ts-jest',
            '@testing-library/jest-dom', '@testing-library/react',
            '@testing-library/user-event', '@testing-library/react-hooks'
        ]
    },
    'vitest-ts': {
        name: 'Vitest + Testing Library',
        packages: ['typescript'],
        devPackages: [
            'vitest', '@vitest/ui', '@vitest/coverage-v8',
            '@testing-library/react', '@testing-library/jest-dom',
            '@testing-library/user-event', 'jsdom'
        ]
    },
    'cypress-ts': {
        name: 'Cypress + Percy',
        packages: ['typescript'],
        devPackages: [
            'cypress', '@testing-library/cypress',
            '@cypress/code-coverage', '@percy/cypress',
            'start-server-and-test'
        ]
    },
    'playwright-ts': {
        name: 'Playwright',
        packages: ['typescript'],
        devPackages: [
            '@playwright/test', '@types/node',
            'playwright-lighthouse', 'axe-playwright'
        ]
    },
    'react-native-ts': {
        name: 'React Native + TypeScript',
        command: 'npx react-native init --template react-native-template-typescript'
    },
    'expo-ts': {
        name: 'Expo + TypeScript',
        command: 'npx create-expo-app -t with-typescript'
    },
    'electron-ts': {
        name: 'Electron + TypeScript',
        command: 'npx create-electron-app --template=typescript'
    },
    'tauri-ts': {
        name: 'Tauri + TypeScript',
        command: 'npx create-tauri-app --typescript'
    },
    'graphql-ts': {
        name: 'GraphQL + TypeScript + Type GraphQL',
        packages: [
            'express', '@types/express',
            'apollo-server-express', 'type-graphql',
            'class-validator', 'graphql', 'reflect-metadata'
        ],
        devPackages: [
            'typescript', '@types/node', 'ts-node', 'nodemon'
        ]
    },
    'trpc-ts': {
        name: 'tRPC + TypeScript',
        packages: [
            '@trpc/server', '@trpc/client', '@trpc/react-query',
            'zod', 'superjson'
        ],
        devPackages: [
            'typescript', '@types/node'
        ]
    },
    'turborepo-ts': {
        name: 'Turborepo + TypeScript',
        command: 'npx create-turbo@latest --typescript'
    },
    'nx-ts': {
        name: 'Nx + TypeScript',
        command: 'npx create-nx-workspace --preset=ts'
    },
    'serverless-ts': {
        name: 'Serverless Framework + TypeScript',
        command: 'npx serverless create --template aws-nodejs-typescript'
    },
    'firebase-ts': {
        name: 'Firebase + TypeScript',
        packages: [
            'firebase', 'firebase-admin',
            'firebase-functions', 'firebase-tools'
        ],
        devPackages: [
            'typescript', '@types/node'
        ]
    }
};

interface DatabasePackages {
    postgres: string[];
    mysql: string[];
    mongodb: string[];
    sqlite: string[];
}

interface BasicDatabaseConfig {
    packages: string[];
    devPackages: string[];
}

interface DatabaseConfigWithInit extends BasicDatabaseConfig {
    initCommand: string;
    dbPackages?: never;
}

interface DatabaseConfigWithDBPackages extends BasicDatabaseConfig {
    dbPackages: DatabasePackages;
    initCommand?: never;
}

type DatabaseConfig = DatabaseConfigWithInit | DatabaseConfigWithDBPackages;

const databases: Record<string, DatabaseConfig> = {
    'prisma': {
        packages: ['@prisma/client'],
        devPackages: ['prisma'],
        initCommand: 'npx prisma init'
    },
    'typeorm': {
        packages: ['typeorm', 'reflect-metadata'],
        devPackages: ['@types/node'],
        dbPackages: {
            postgres: ['pg', '@types/pg'],
            mysql: ['mysql2', '@types/mysql'],
            mongodb: ['mongodb', '@types/mongodb'],
            sqlite: ['sqlite3']
        }
    },
    'mongoose': {
        packages: ['mongoose', '@types/mongoose'],
        devPackages: [],
        dbPackages: {
            postgres: [],
            mysql: [],
            mongodb: ['mongodb', '@types/mongodb'],
            sqlite: []
        }
    },
    'sequelize': {
        packages: ['sequelize', '@types/sequelize'],
        devPackages: [],
        dbPackages: {
            postgres: ['pg', '@types/pg'],
            mysql: ['mysql2', '@types/mysql'],
            sqlite: ['sqlite3'],
            mongodb: []
        }
    }
};

const authProviders = {
    'jwt': ['jsonwebtoken', '@types/jsonwebtoken', 'bcrypt', '@types/bcrypt'],
    'passport': ['passport', '@types/passport', 'passport-local', '@types/passport-local'],
    'oauth': ['passport', '@types/passport', 'passport-oauth2', '@types/passport-oauth2'],
    'firebase': ['firebase-auth', 'firebase-admin'],
    'auth0': ['@auth0/auth0-react', '@auth0/auth0-spa-js'],
    'nextauth': ['next-auth', '@auth0/nextjs-auth0'],
    'clerk': ['@clerk/nextjs', '@clerk/clerk-react']
};

interface DockerConfig {
    dockerfile: string;
    dockerCompose?: string;
    dockerignore: string;
}

interface CIConfig {
    provider: 'github' | 'gitlab' | 'azure' | 'jenkins';
    config: string;
}

interface PWAConfig {
    manifest: string;
    serviceWorker: string;
    icons: {
        sizes: number[];
        template: string;
    };
}

const dockerConfigs: Record<string, DockerConfig> = {
    'node': {
        dockerfile: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`,
        dockerCompose: `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - .:/app
      - /app/node_modules`,
        dockerignore: `node_modules
npm-debug.log
build
.dockerignore
.git
.gitignore
README.md`
    },
    'nginx': {
        dockerfile: `FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
        dockerCompose: `version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf`,
        dockerignore: `node_modules
npm-debug.log
build
dist
.dockerignore
.git
.gitignore
README.md`
    }
};

const ciConfigs: Record<string, CIConfig> = {
    'github': {
        provider: 'github',
        config: `name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Deploy
      if: github.ref == 'refs/heads/main'
      run: |
        # Add your deployment steps here`
    },
    'gitlab': {
        provider: 'gitlab',
        config: `image: node:18

stages:
  - test
  - build
  - deploy

cache:
  paths:
    - node_modules/

test:
  stage: test
  script:
    - npm ci
    - npm test

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - echo "Deploy to production"
  only:
    - main`
    }
};

const pwaConfigs: Record<string, PWAConfig> = {
    'basic': {
        manifest: `{
  "name": "My PWA App",
  "short_name": "PWA App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}`,
        serviceWorker: `// Service Worker
const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});`,
        icons: {
            sizes: [72, 96, 128, 144, 152, 192, 384, 512],
            template: `<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE" viewBox="0 0 24 24">
    <path fill="#000000" d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8L20 9v6l-8 4-8-4V9l8-4.2z"/>
</svg>`
        }
    }
};

async function setupDocker(fullPath: string, template: string = 'node') {
    const config = dockerConfigs[template];
    if (!config) return;

    await fs.writeFile(path.join(fullPath, 'Dockerfile'), config.dockerfile);
    if (config.dockerCompose) {
        await fs.writeFile(path.join(fullPath, 'docker-compose.yml'), config.dockerCompose);
    }
    await fs.writeFile(path.join(fullPath, '.dockerignore'), config.dockerignore);
}

async function setupCI(fullPath: string, provider: string = 'github') {
    const config = ciConfigs[provider];
    if (!config) return;

    const ciPath = provider === 'github' ? '.github/workflows' : '.gitlab';
    const ciFile = provider === 'github' ? 'ci.yml' : '.gitlab-ci.yml';
    
    await fs.mkdir(path.join(fullPath, ciPath), { recursive: true });
    await fs.writeFile(path.join(fullPath, ciPath, ciFile), config.config);
}

async function setupPWA(fullPath: string, template: string = 'basic') {
    const config = pwaConfigs[template];
    if (!config) return;

    
    await fs.writeFile(path.join(fullPath, 'public', 'manifest.json'), config.manifest);
    
    
    await fs.writeFile(path.join(fullPath, 'public', 'service-worker.js'), config.serviceWorker);
    
    
    const iconsDir = path.join(fullPath, 'public', 'icons');
    await fs.mkdir(iconsDir, { recursive: true });
    
    for (const size of config.icons.sizes) {
        const iconContent = config.icons.template.replace(/SIZE/g, size.toString());
        await fs.writeFile(path.join(iconsDir, `icon-${size}x${size}.svg`), iconContent);
    }

    const indexPath = path.join(fullPath, 'public', 'index.html');
    if (await fs.access(indexPath).then(() => true).catch(() => false)) {
        let indexContent = await fs.readFile(indexPath, 'utf-8');
        if (!indexContent.includes('manifest.json')) {
            indexContent = indexContent.replace(
                '</head>',
                `    <link rel="manifest" href="/manifest.json" />
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js');
            });
        }
    </script>
</head>`
            );
            await fs.writeFile(indexPath, indexContent);
        }
    }
}

export async function template(name: string, options: TemplateOptions) {
    const spinner = ora('Initializing template...').start();
    
    try {
        const templateConfig = templates[options.template as keyof typeof templates];
        if (!templateConfig) {
            throw new Error(`Template "${options.template}" not found`);
        }

        const projectPath = options.path || name;
        const fullPath = path.resolve(projectPath);

        await fs.mkdir(fullPath, { recursive: true });

        spinner.text = `Creating ${templateConfig.name} project...`;

        if ('command' in templateConfig) {
            spinner.text = `Running ${templateConfig.command}...`;
            await execAsync(`${templateConfig.command} ${name}`);
        } else {
            await execAsync('npm init -y', { cwd: fullPath });

            if (templateConfig.packages?.length) {
                spinner.text = 'Installing dependencies...';
                await execAsync(`npm install ${templateConfig.packages.join(' ')}`, { cwd: fullPath });
            }

            if (templateConfig.devPackages?.length) {
                spinner.text = 'Installing dev dependencies...';
                await execAsync(`npm install -D ${templateConfig.devPackages.join(' ')}`, { cwd: fullPath });
            }

            if (options.database) {
                const dbConfig = databases[options.database as keyof typeof databases];
                if (dbConfig) {
                    spinner.text = `Setting up ${options.database}...`;
                    await execAsync(`npm install ${dbConfig.packages.join(' ')}`, { cwd: fullPath });
                    await execAsync(`npm install -D ${dbConfig.devPackages.join(' ')}`, { cwd: fullPath });
                    
                    if ('initCommand' in dbConfig && dbConfig.initCommand) {
                        await execAsync(dbConfig.initCommand, { cwd: fullPath });
                    }

                    if ('dbPackages' in dbConfig && dbConfig.dbPackages) {
                        for (const [dbType, packages] of Object.entries(dbConfig.dbPackages)) {
                            if (packages.length > 0) {
                                spinner.text = `Installing ${dbType} packages...`;
                                await execAsync(`npm install ${packages.join(' ')}`, { cwd: fullPath });
                            }
                        }
                    }
                }
            }

            if (options.auth) {
                spinner.text = 'Setting up authentication...';
                const authPackages = authProviders.jwt;
                await execAsync(`npm install ${authPackages.join(' ')}`, { cwd: fullPath });
            }

            if (options.docker) {
                spinner.text = 'Adding Docker support...';
                await setupDocker(fullPath, options.template?.includes('nginx') ? 'nginx' : 'node');
            }

            if (options.ci) {
                spinner.text = 'Adding CI/CD configuration...';
                await setupCI(fullPath, 'github'); 
            }

            if (options.pwa) {
                spinner.text = 'Adding PWA support...';
                await setupPWA(fullPath);
            }

            
            const readme = `# ${name}

## Description
${templateConfig.name} project created with TypeScript Code Analyzer Pro.

## Features
${options.database ? `- Database: ${options.database}\n` : ''}${options.auth ? '- Authentication with JWT\n' : ''}${options.api ? '- API support\n' : ''}${options.pwa ? '- PWA support\n' : ''}${options.docker ? '- Docker support\n' : ''}${options.ci ? '- CI/CD configuration\n' : ''}${options.testing ? '- Testing setup\n' : ''}

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
${options.docker ? '- Docker and Docker Compose\n' : ''}

### Installation
\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

${options.docker ? `### Docker
\`\`\`bash
# Build and run with Docker Compose
docker-compose up --build
\`\`\`\n` : ''}

${options.database ? `### Database
Follow these steps to set up your database:
1. Configure your database connection in \`.env\`
2. Run migrations: \`npm run db:migrate\`
3. (Optional) Seed the database: \`npm run db:seed\`\n` : ''}

## Scripts
- \`npm run dev\`: Start development server
- \`npm run build\`: Build for production
- \`npm start\`: Start production server
- \`npm test\`: Run tests
${options.database ? '- `npm run db:migrate`: Run database migrations\n' : ''}${options.database ? '- `npm run db:seed`: Seed the database\n' : ''}

## Project Structure
\`\`\`
${name}/
├── src/
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── api/          # API routes
│   ├── hooks/        # Custom hooks
│   ├── utils/        # Utility functions
│   ├── types/        # TypeScript types
│   └── styles/       # CSS/SCSS styles
├── public/           # Static files
├── tests/           # Test files
${options.docker ? '├── Dockerfile\n├── docker-compose.yml\n' : ''}${options.ci ? '├── .github/workflows/    # GitHub Actions\n' : ''}└── README.md
\`\`\`

## Contributing
1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/my-feature\`
3. Commit your changes: \`git commit -am 'Add my feature'\`
4. Push to the branch: \`git push origin feature/my-feature\`
5. Submit a pull request

## License
This project is licensed under the MIT License.
`;
            await fs.writeFile(path.join(fullPath, 'README.md'), readme);
        }

        spinner.succeed(chalk.green(`Successfully created ${templateConfig.name} project at ${chalk.blue(fullPath)}`));
        
        console.log('\n📝 Next steps:');
        console.log(chalk.cyan(`  cd ${name}`));
        console.log(chalk.cyan('  npm install'));
        console.log(chalk.cyan('  npm run dev'));

        if (options.database) {
            console.log(chalk.yellow('\n💾 Database:'));
            console.log(chalk.cyan(`  Database system: ${options.database}`));
            console.log(chalk.cyan('  1. Configure your database connection in .env'));
            console.log(chalk.cyan('  2. Run migrations: npm run db:migrate'));
        }

        if (options.auth) {
            console.log(chalk.yellow('\n🔐 Authentication:'));
            console.log(chalk.cyan('  JWT authentication is set up'));
            console.log(chalk.cyan('  1. Configure your JWT secret in .env'));
            console.log(chalk.cyan('  2. Import auth middleware from src/middleware/auth.ts'));
        }

        if (options.docker) {
            console.log(chalk.yellow('\n🐳 Docker:'));
            console.log(chalk.cyan('  1. Build and run: docker-compose up --build'));
            console.log(chalk.cyan('  2. Stop containers: docker-compose down'));
        }

        if (options.pwa) {
            console.log(chalk.yellow('\n📱 PWA:'));
            console.log(chalk.cyan('  1. PWA is configured and ready to use'));
            console.log(chalk.cyan('  2. Test offline functionality in production build'));
        }

        console.log(chalk.yellow('\n📖 Documentation:'));
        console.log(chalk.cyan('  Check README.md for detailed instructions and project structure'));

    } catch (error) {
        spinner.fail('Template creation failed!');
        logger.error('Template error:', error);
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
