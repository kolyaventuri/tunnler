import process from 'node:process';
import * as util from 'node:util';
import {asyncExitHook} from 'exit-hook';
import * as Tunnel from './index.js';

const args = util.parseArgs({
	options: {
		port: {
			type: 'string',
			short: 'p',
		},
		subdomain: {
			type: 'string',
			short: 's',
		},
		zone: {
			type: 'string',
			short: 'z',
		},
		service: {
			type: 'string',
			short: 'e',
			default: 'http://localhost',
		},
		apiKey: {
			type: 'string',
			short: 'a',
		},
		accountId: {
			type: 'string',
			short: 'i',
		},
		help: {
			type: 'boolean',
			short: 'h',
		},
	},
});

const helpMessage = `
Usage:
  tunnler [options]

Options:
  -p, --port <port>    The port to tunnel to
  -s, --subdomain <subdomain>    The subdomain to tunnel to (default: random)
  -z, --zone <zone>    The zone to tunnel to)
  -e, --service <service>    The service to tunnel to (default: http://localhost)
  -a, --apiKey <apiKey>    The API key to use
  -i, --accountId <accountId>    The account ID to use
  -h, --help    Show help
`;

if (args.values.help) {
	console.log(helpMessage);
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0);
}

const port = args.values.port ? Number.parseInt(args.values.port, 10) : undefined;

if (!args.values.port) {
	throw new Error('Port is required');
} else if (Number.isNaN(port) || !port) {
	throw new Error('Port must be a number');
} else if (port < 1 || port > 65_535) {
	throw new Error('Port must be between 1 and 65535');
}

const {subdomain} = args.values;
const {zone} = args.values;
const {service} = args.values;

const tunnel = await Tunnel.createTunnel({
	port,
	subdomain,
	zone,
	service,
});

asyncExitHook(async () => {
	await tunnel?.close();
}, {wait: 5000});

await tunnel.connect();
