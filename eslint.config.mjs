import path from 'path';
import { fileURLToPath } from 'url';

import { presets } from '@plyaz/devtools/eslint/base.frontend.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = presets.nextjs({
  enableNextjs: true,
  enableReact: false,
  enableReactRefresh: false,
  tsconfigDir: __dirname,
  enableImport: true,
});

// Next.js API routes REQUIRE uppercase HTTP method names (GET, POST, DELETE, etc.)
// This is a framework requirement, not a code style choice
config.push({
  name: 'plyaz/nextjs-api-routes',
  files: ['src/app/api/**/*.ts'],
  rules: {
    '@typescript-eslint/naming-convention': 'off',
    'import/prefer-default-export': 'off',
  },
});

export default config;
