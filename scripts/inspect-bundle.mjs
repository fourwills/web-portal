import fs from 'fs';
import path from 'path';

const dist = path.join(process.cwd(), 'dist', 'assets');
const file = fs.readdirSync(dist).find((f) => f.startsWith('index-') && f.endsWith('.js'));
const js = fs.readFileSync(path.join(dist, file), 'utf8');
const paths = [...js.matchAll(/\.post\("([^"]+)"/g)].map((m) => m[1]);
console.log('POST paths in bundle:', [...new Set(paths)].sort());
console.log('auth/login present:', js.includes('auth/login'));
