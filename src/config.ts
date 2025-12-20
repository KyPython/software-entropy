import * as fs from 'fs';
import * as path from 'path';

export interface CodeQualityConfig {
  rules?: {
    'long-function'?: {
      enabled?: boolean;
      maxLines?: number;
    };
    'large-file'?: {
      enabled?: boolean;
      maxLines?: number;
    };
    'todo-fixme-density'?: {
      enabled?: boolean;
      maxDensity?: number;
    };
  };
  include?: string[];
  exclude?: string[];
  baseline?: {
    enabled?: boolean;
    file?: string;
  };
  ci?: {
    annotations?: boolean;
    failOnHigh?: boolean;
    failOnMedium?: boolean;
  };
  metrics?: {
    enabled?: boolean;
    format?: 'prometheus' | 'json';
    output?: string;
  };
}

const DEFAULT_CONFIG: CodeQualityConfig = {
  rules: {
    'long-function': {
      enabled: true,
      maxLines: 50
    },
    'large-file': {
      enabled: true,
      maxLines: 500
    },
    'todo-fixme-density': {
      enabled: true,
      maxDensity: 5
    }
  },
  include: ['**/*.{js,ts,jsx,tsx,py,java,cpp,c,cc,h,hpp}'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  ci: {
    annotations: true,
    failOnHigh: true,
    failOnMedium: false
  }
};

export function loadConfig(configPath?: string): CodeQualityConfig {
  const searchPaths = configPath
    ? [path.resolve(configPath)]
    : [
        path.resolve('.code-quality-config.json'),
        path.resolve('code-quality-config.json'),
        path.resolve('.software-entropy.json'),
        path.resolve('software-entropy.json')
      ];

  for (const configFile of searchPaths) {
    if (fs.existsSync(configFile)) {
      try {
        const content = fs.readFileSync(configFile, 'utf-8');
        const userConfig = JSON.parse(content);
        return mergeConfig(DEFAULT_CONFIG, userConfig);
      } catch (error) {
        console.warn(`Warning: Failed to parse config file ${configFile}:`, error);
      }
    }
  }

  return DEFAULT_CONFIG;
}

function mergeConfig(
  defaultConfig: CodeQualityConfig,
  userConfig: CodeQualityConfig
): CodeQualityConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    rules: {
      ...defaultConfig.rules,
      ...userConfig.rules,
      'long-function': {
        ...defaultConfig.rules?.['long-function'],
        ...userConfig.rules?.['long-function']
      },
      'large-file': {
        ...defaultConfig.rules?.['large-file'],
        ...userConfig.rules?.['large-file']
      },
      'todo-fixme-density': {
        ...defaultConfig.rules?.['todo-fixme-density'],
        ...userConfig.rules?.['todo-fixme-density']
      }
    },
    ci: {
      ...defaultConfig.ci,
      ...userConfig.ci
    }
  };
}

