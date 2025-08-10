import {loadEnv} from './constants.js';

type InitOptions = {
	envPath?: string;
	apiKey?: string;
	accountId?: string;
	defaultZone?: string;
};

export const init = (options: InitOptions) => {
	loadEnv(options);
};

loadEnv({});

export {create as createTunnel} from './tunnel.js';
