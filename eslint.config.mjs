import path from 'path';
import { fileURLToPath } from 'url';

import { presets } from '@plyaz/devtools/eslint/base.frontend.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default presets.nextjs({
  enableNextjs: true,
  enableReact: false,
  enableReactRefresh: false,
  tsconfigDir: __dirname,
  enableImport: true,
});
