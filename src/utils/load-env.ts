import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const HOME_DIR = os.homedir();
const ENV_PATH = path.join(HOME_DIR, '.tunnler', 'credentials.json');

type Env = Partial<{
	CLOUDLFARE_API_KEY: string;
	CLOUDLFARE_ACCOUNT_ID: string;
	DEFAULT_ZONE: string;
}>;
export const loadFileEnv = () => {
	try {
		fs.accessSync(ENV_PATH);
		const env = JSON.parse(fs.readFileSync(ENV_PATH, 'utf8')) as Env;
		return {
			CLOUDLFARE_API_KEY: env.CLOUDLFARE_API_KEY,
			CLOUDLFARE_ACCOUNT_ID: env.CLOUDLFARE_ACCOUNT_ID,
			DEFAULT_ZONE: env.DEFAULT_ZONE,
		};
	} catch {
		return {};
	}
};
