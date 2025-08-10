import process from 'node:process';
import dotenv from 'dotenv';
import {loadFileEnv} from './utils/load-env.js';

let envMap: Record<string, string | undefined> = {
	CLOUDLFARE_API_KEY: process.env.CLOUDLFARE_API_KEY,
	CLOUDLFARE_ACCOUNT_ID: process.env.CLOUDLFARE_ACCOUNT_ID,
	DEFAULT_ZONE: process.env.DEFAULT_ZONE,
};

// Helper function to merge objects without overwriting with undefined values
const mergeWithoutUndefined = (target: Record<string, string | undefined>, ...sources: Array<Record<string, string | undefined>>) => {
	const result = {...target};
	for (const source of sources) {
		for (const [key, value] of Object.entries(source)) {
			if (value !== undefined) {
				result[key] = value;
			}
		}
	}

	return result;
};

export const getCLOUDFLARE_API_KEY = () => envMap.CLOUDLFARE_API_KEY;
export const getCLOUDFLARE_ACCOUNT_ID = () => envMap.CLOUDLFARE_ACCOUNT_ID;
export const getDEFAULT_ZONE = () => envMap.DEFAULT_ZONE;

type LoadEnvOptions = {
	path?: string;
	apiKey?: string;
	accountId?: string;
	defaultZone?: string;
};

export const loadEnv = (options: LoadEnvOptions) => {
	const env = dotenv.config({path: options.path, quiet: true});
	const dotEnvApiKey = env.parsed?.CLOUDLFARE_API_KEY;
	const dotEnvAccountId = env.parsed?.CLOUDLFARE_ACCOUNT_ID;
	const dotEnvDefaultZone = env.parsed?.CLOUDLFARE_DEFAULT_ZONE;
	const parsed = {
		CLOUDLFARE_API_KEY: dotEnvApiKey,
		CLOUDLFARE_ACCOUNT_ID: dotEnvAccountId,
		DEFAULT_ZONE: dotEnvDefaultZone,
	};

	const loaded = loadFileEnv();
	const passed = {
		CLOUDLFARE_API_KEY: options.apiKey,
		CLOUDLFARE_ACCOUNT_ID: options.accountId,
		DEFAULT_ZONE: options.defaultZone,
	};

	envMap = mergeWithoutUndefined(envMap, loaded, parsed, passed);

	return envMap;
};
