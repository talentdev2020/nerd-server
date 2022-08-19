import { config } from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(__dirname, './.env');

config({ path: envPath });

export default process.env;
