import process from 'node:process';
import dotenv from 'dotenv';

let envMap: Record<string, string | undefined> = {};

export const getCLOUDFLARE_API_KEY = () => envMap.CLOUDLFARE_API_KEY;
export const getCLOUDFLARE_ACCOUNT_ID = () => envMap.CLOUDLFARE_ACCOUNT_ID;
export const getDEFAULT_ZONE = () => envMap.DEFAULT_ZONE;
export const getTUNNEL_HOST = () => envMap.TUNNEL_HOST;

type LoadEnvOptions = {
	path?: string;
	apiKey?: string;
	accountId?: string;
	defaultZone?: string;
};

export const loadEnv = (options: LoadEnvOptions) => {
	const env = dotenv.config({path: options.path});
	envMap = {
		...envMap,

		CLOUDLFARE_API_KEY: options.apiKey ?? process.env.CLOUDLFARE_API_KEY,
		CLOUDLFARE_ACCOUNT_ID: options.accountId ?? process.env.CLOUDLFARE_ACCOUNT_ID,
		DEFAULT_ZONE: options.defaultZone ?? process.env.CLOUDLFARE_DEFAULT_ZONE,
		...env.parsed,
	};
	return envMap;
};
