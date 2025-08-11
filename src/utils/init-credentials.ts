import {homedir} from 'node:os';
import {join} from 'node:path';
import fs from 'node:fs/promises';

const HOME_DIR = homedir();
const CREDENTIALS_DIR = join(HOME_DIR, '.tunnler');
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, 'credentials.json');

type InitOptions = {
	apiKey: string;
	accountId: string;
	defaultZone?: string;
};

export const initCredentials = async (input: InitOptions) => {
	const data = {
		CLOUDLFARE_API_KEY: input.apiKey,
		CLOUDLFARE_ACCOUNT_ID: input.accountId,
		DEFAULT_ZONE: input.defaultZone,
	};

	// eslint-disable-next-line promise/prefer-await-to-then
	const exists = await fs.access(CREDENTIALS_DIR).then(() => true).catch(() => false);
	if (!exists) {
		await fs.mkdir(CREDENTIALS_DIR, {recursive: true});
	}

	const raw = JSON.stringify(data, null, 2);

	await fs.writeFile(CREDENTIALS_FILE, raw);

	return CREDENTIALS_FILE;
};
