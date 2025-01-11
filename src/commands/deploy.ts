import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

interface DeployOptions {
  platform?: string;
  region?: string;
  environment?: string;
  branch?: string;
}

interface PlatformConfig {
  vercel: {
    team: string;
    project: string;
  };
  netlify: {
    site: string;
    team: string;
  };
  aws: {
    region: string;
    profile: string;
  };
  azure: {
    subscription: string;
    resourceGroup: string;
  };
  gcp: {
    project: string;
    region: string;
  };
}

interface DeploymentConfig {
  defaultPlatform: string;
  environments: {
    production: {
      branch: string;
      autoApprove: boolean;
    };
    staging: {
      branch: string;
      autoApprove: boolean;
    };
  };
  platforms: PlatformConfig;
}

interface TSAConfig {
  version: string;
  include: string[];
  analysis: {
    performance: boolean;
    memory: boolean;
    dependencies: boolean;
  };
  reporting: {
    format: string;
    output: string;
  };
  deployment?: DeploymentConfig;
}

class DeploymentManager {
  private spinner: any;
  private config!: TSAConfig;
  private configPath: string;
  private defaultConfig: DeploymentConfig = {
    defaultPlatform: "vercel",
    environments: {
      production: {
        branch: "main",
        autoApprove: false
      },
      staging: {
        branch: "develop",
        autoApprove: true
      }
    },
    platforms: {
      vercel: {
        team: "",
        project: ""
      },
      netlify: {
        site: "",
        team: ""
      },
      aws: {
        region: "us-east-1",
        profile: "default"
      },
      azure: {
        subscription: "",
        resourceGroup: ""
      },
      gcp: {
        project: "",
        region: "us-central1"
      }
    }
  };

  constructor() {
    this.spinner = ora();
    this.configPath = join(process.cwd(), 'tsa.config.json');
    this.loadConfig();
  }

  private loadConfig() {
    if (!existsSync(this.configPath)) {
      console.error(chalk.red('Error: tsa.config.json not found. Please run "tsa init" first.'));
      process.exit(1);
    }

    try {
      this.config = JSON.parse(readFileSync(this.configPath, 'utf8'));
      if (!this.config.deployment) {
        this.config.deployment = this.defaultConfig;
        console.log(chalk.yellow('No deployment configuration found, using defaults.'));
      }
    } catch (error) {
      console.error(chalk.red('Error reading configuration file:'), error);
      process.exit(1);
    }
  }

  private async verifyDependencies(platform: string) {
    const dependencies: { [key: string]: string } = {
      vercel: 'vercel',
      netlify: 'netlify-cli',
      aws: 'aws-cli',
      azure: 'azure-cli',
      gcp: 'gcloud',
    };

    const cmd = dependencies[platform];
    if (!cmd) return false;

    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private async installDependencies(platform: string) {
    const packages: { [key: string]: string } = {
      vercel: 'vercel',
      netlify: 'netlify-cli',
      aws: '@aws-amplify/cli',
      azure: '@azure/cli',
      gcp: '@google-cloud/cli',
    };

    const pkg = packages[platform];
    if (!pkg) return;

    this.spinner.start(`Installing ${pkg}...`);
    try {
      execSync(`npm install -g ${pkg}`, { stdio: 'ignore' });
      this.spinner.succeed(`${pkg} installed successfully`);
    } catch (error) {
      this.spinner.fail(`Failed to install ${pkg}`);
      throw error;
    }
  }

  private async vercelDeploy(options: DeployOptions) {
    const { environment = 'production' } = options;
    const config = this.config.deployment!.platforms.vercel;
    
    this.spinner.start('Deploying to Vercel...');
    try {
      const cmd = [
        'vercel deploy',
        environment === 'production' ? '--prod' : '',
        config.team ? `--scope ${config.team}` : '',
        config.project ? `--name ${config.project}` : ''
      ].filter(Boolean).join(' ');
      
      execSync(cmd, { stdio: 'inherit' });
      this.spinner.succeed('Deployed to Vercel successfully');
    } catch (error) {
      this.spinner.fail('Vercel deployment failed');
      throw error;
    }
  }

  private async netlifyDeploy(options: DeployOptions) {
    const { environment = 'production' } = options;
    const config = this.config.deployment!.platforms.netlify;
    
    this.spinner.start('Deploying to Netlify...');
    try {
      const cmd = [
        'netlify deploy',
        environment === 'production' ? '--prod' : '',
        config.site ? `--site ${config.site}` : '',
        config.team ? `--team ${config.team}` : ''
      ].filter(Boolean).join(' ');
      
      execSync(cmd, { stdio: 'inherit' });
      this.spinner.succeed('Deployed to Netlify successfully');
    } catch (error) {
      this.spinner.fail('Netlify deployment failed');
      throw error;
    }
  }

  private async awsDeploy(options: DeployOptions) {
    const { region = this.config.deployment!.platforms.aws.region } = options;
    const config = this.config.deployment!.platforms.aws;
    
    this.spinner.start('Deploying to AWS...');
    try {
      const cmd = [
        'aws amplify push',
        `--region ${region}`,
        config.profile ? `--profile ${config.profile}` : ''
      ].filter(Boolean).join(' ');
      
      execSync(cmd, { stdio: 'inherit' });
      this.spinner.succeed('Deployed to AWS successfully');
    } catch (error) {
      this.spinner.fail('AWS deployment failed');
      throw error;
    }
  }

  private async azureDeploy(options: DeployOptions) {
    const config = this.config.deployment!.platforms.azure;
    
    this.spinner.start('Deploying to Azure...');
    try {
      const cmd = [
        'az webapp up',
        config.subscription ? `--subscription ${config.subscription}` : '',
        config.resourceGroup ? `--resource-group ${config.resourceGroup}` : ''
      ].filter(Boolean).join(' ');
      
      execSync(cmd, { stdio: 'inherit' });
      this.spinner.succeed('Deployed to Azure successfully');
    } catch (error) {
      this.spinner.fail('Azure deployment failed');
      throw error;
    }
  }

  private async gcpDeploy(options: DeployOptions) {
    const config = this.config.deployment!.platforms.gcp;
    
    this.spinner.start('Deploying to Google Cloud...');
    try {
      const cmd = [
        'gcloud app deploy',
        config.project ? `--project=${config.project}` : '',
        '--quiet'
      ].filter(Boolean).join(' ');
      
      execSync(cmd, { stdio: 'inherit' });
      this.spinner.succeed('Deployed to Google Cloud successfully');
    } catch (error) {
      this.spinner.fail('Google Cloud deployment failed');
      throw error;
    }
  }

  public async deploy(options: DeployOptions) {
    const { platform = this.config.deployment?.defaultPlatform } = options;

    if (!platform) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'platform',
          message: 'Select deployment platform:',
          choices: ['vercel', 'netlify', 'aws', 'azure', 'gcp'],
          default: this.config.deployment?.defaultPlatform || 'vercel'
        }
      ]);
      options.platform = answer.platform;
    }

    // Verify dependencies
    const hasDepInstalled = await this.verifyDependencies(options.platform!);
    if (!hasDepInstalled) {
      const { install } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'install',
          message: `${options.platform} CLI is not installed. Would you like to install it?`,
          default: true
        }
      ]);

      if (install) {
        await this.installDependencies(options.platform!);
      } else {
        console.log(chalk.red('Deployment cancelled: Required CLI tool is not installed'));
        return;
      }
    }

    // Platform specific deployment
    try {
      switch (options.platform) {
        case 'vercel':
          await this.vercelDeploy(options);
          break;
        case 'netlify':
          await this.netlifyDeploy(options);
          break;
        case 'aws':
          await this.awsDeploy(options);
          break;
        case 'azure':
          await this.azureDeploy(options);
          break;
        case 'gcp':
          await this.gcpDeploy(options);
          break;
        default:
          console.log(chalk.red(`Unsupported platform: ${options.platform}`));
      }
    } catch (error: any) {
      console.error(chalk.red(`Deployment error: ${error.message}`));
      process.exit(1);
    }
  }
}

export const deployCommand = async (options: DeployOptions) => {
  const manager = new DeploymentManager();
  await manager.deploy(options);
};
