import process, {argv} from 'node:process';
import {type ChildProcess, execFile, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
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

const deferredPromise = <T = unknown>() => {
	let resolve: (value: T | PromiseLike<T>) => void;
	let reject: (reason?: any) => void;

	const promise = new Promise<T>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});

	return {
		promise,
		resolve: resolve!,
		reject: reject!,
	};
};

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

	let destroyed = false;
	const close = async (attempts = 0) => {
		const {promise, resolve, reject} = deferredPromise<void>();
		if (!child) {
			return;
		}

		if (!child.killed) {
			child.kill();
		}

		setTimeout(() => {
			if (destroyed) {
				return;
			}

			if (attempts > 10) {
				reject(new Error('Failed to close tunnel'));
				return;
			}

			if (child?.killed) {
				destroyed = true;
				/* eslint-disable promise/prefer-await-to-then */
				_destroy({recordId, tunnelId})
					.then(() => {
						child = undefined;
						const message = `${chalk.yellow('[Tunnel] Connection closed')}\n`;
						console.log(message);
						resolve();
					})
					.catch((error: unknown) => {
						console.error(error);
						reject(error);
					});
				return;
			}

			close(attempts + 1)
				.then(() => {
					resolve();
				})
				.catch((error: unknown) => {
					reject(error);
				});
			/* eslint-enable promise/prefer-await-to-then */
		}, 100);

		return promise;
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

// If not cli
const FILE = fileURLToPath(import.meta.url);
const isCLI = FILE === argv[1];

if (!isCLI) {
	asyncExitHook(async () => {
		const closePromises = [...tunnels.values()].map(async tunnel => tunnel.close());
		console.log('closePromises', closePromises);
		await Promise.all(closePromises);
	}, {wait: 5000});
}
