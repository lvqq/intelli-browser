// copy md from the root directory of the monorepo to the packages/core directory 

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.dirname(path.dirname(path.dirname(__dirname)));

fs.copyFileSync(path.join(root, 'README.md'), path.join(__dirname, '..', 'README.md'));
