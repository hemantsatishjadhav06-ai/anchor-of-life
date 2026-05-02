// Loads .env.local for any script that runs outside Next's runtime.
import { config } from 'dotenv';
import path from 'node:path';
config({ path: path.join(process.cwd(), '.env.local') });
