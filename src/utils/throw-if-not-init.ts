import {execSync} from 'node:child_process';
import {getCLOUDFLARE_ACCOUNT_ID, getCLOUDFLARE_API_KEY} from '../constants.js';

export const throwIfNotInit = () => {
	if (!getCLOUDFLARE_API_KEY()) {
		throw new Error('Cloudflare API key is not configured. Please set the CLOUDLFARE_API_KEY environment variable.');
	}

	if (!getCLOUDFLARE_ACCOUNT_ID()) {
		throw new Error('Cloudflare account ID is not configured. Please set the CLOUDLFARE_ACCOUNT_ID environment variable.');
	}

	try {
		execSync('cloudflared --version', {stdio: 'ignore'});
	} catch {
		throw new Error('cloudflared executable is not available on the system. Please install cloudflared and ensure it is in your PATH.');
	}
};
