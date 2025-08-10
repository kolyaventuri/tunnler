import process from 'node:process';
import {type ChildProcess, execFile, spawn} from 'node:child_process';
import chalk from 'chalk';
import {asyncExitHook} from 'exit-hook';
import {deleteRecord, upsertRecord} from './utils/dns.js';
import {throwIfNotInit} from './utils/throw-if-not-init.js';
import {create as createTunnel, attach as attachTunnel, destroy as destroyTunnel} from './utils/tunnel.js';
import {uuid} from './utils/uuid.js';
import {getDEFAULT_ZONE} from './constants.js';

type TunnelOptions = {
	port: number;
	subdomain?: string;
	service?: string;
	zone?: string;
};

type Tunnel = {
	recordId: string;
	token: string;
	tunnelId: string;
	connect: () => Promise<void>;
	close: () => Promise<void>;
};
const tunnels = new Map<string, Tunnel>();

export const create = async (options: TunnelOptions): Promise<Tunnel> => {
	throwIfNotInit();

	const subdomain = options.subdomain ?? uuid();
	const service = options.service ?? 'http://localhost';

	const {token, tunnelId} = await createTunnel(subdomain);
	if (!token) {
		throw new Error('Failed to create tunnel');
	}

	const domain = `${subdomain}.${options.zone ?? getDEFAULT_ZONE()}`;
	await attachTunnel({
		tunnelId,
		domain,
		service: `${service}:${options.port}`,
	});

	const hostname = `${tunnelId}.cfargotunnel.com`;

	const record = await upsertRecord({
		name: subdomain,
		content: hostname,
	});

	const recordId = record.id;

	let child: ChildProcess | undefined;
	const connect = async () => {
		if (child) {
			return;
		}

		child = await _connect(token);
		child.on('exit', close);

		const fullService = `${service}:${options.port}`;

		let message = `${chalk.green('[Tunnel] Connection established')}\n`;
		message += `${chalk.blueBright(domain)} -> ${chalk.yellow(fullService)}`;

		console.log(message);
	};

	const close = async () => {
		if (!child) {
			return;
		}

		if (!child.killed) {
			child.kill();
		}

		child = undefined;
		await _destroy({recordId, tunnelId});

		const message = `${chalk.yellow('[Tunnel] Connection closed')}\n`;
		console.log(message);
	};

	const tunnel: Tunnel = {
		recordId,
		token,
		tunnelId,
		connect,
		close,
	};

	tunnels.set(tunnelId, tunnel);
	return tunnel;
};

type DestroyOptions = {
	recordId: string;
	tunnelId: string;
};

const _destroy = async (options: DestroyOptions) => {
	throwIfNotInit();

	const {recordId, tunnelId} = options;

	await deleteRecord(recordId);
	await destroyTunnel(tunnelId);
};

const _connect = async (token: string) => {
	throwIfNotInit();

	const child = spawn('cloudflared', ['tunnel', 'run', '--token', token], {
		stdio: 'ignore',
	});

	child.on('error', error => {
		throw new Error(`Cloudflared exited with code ${error}`);
	});

	child.on('exit', code => {
		if (code && code !== 0) {
			throw new Error(`Cloudflared exited with code ${code}`);
		}
	});

	return child;
};

asyncExitHook(async () => {
	const closePromises = [...tunnels.values()].map(async tunnel => tunnel.close());
	console.log('closePromises', closePromises);
	await Promise.all(closePromises);
}, {wait: 5000});
