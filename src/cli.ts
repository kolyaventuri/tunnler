import process from 'node:process';
import * as util from 'node:util';
import * as readline from 'node:readline';
import {asyncExitHook} from 'exit-hook';
import {initCredentials} from './utils/init-credentials.js';
import * as Tunnel from './index.js';

// Get the command and remaining arguments
const args = process.argv.slice(2);
const command = args[0];
const remainingArgs = args.slice(1);

const helpMessage = `
Usage:
  tunnler <command> [options]

Commands:
  init                    Initialize tunnler configuration
  tunnel                  Create a tunnel (default command)

Examples:
  tunnler init --apiKey <key> --accountId <id> --zone <zone>
  tunnler init (will prompt for credentials)
  tunnler tunnel --port 3000 --subdomain myapp
  tunnler --port 3000 --subdomain myapp

Options:
  -p, --port <port>              The port to tunnel to
  -s, --subdomain <subdomain>    The subdomain to tunnel to (default: random)
  -z, --zone <zone>              The zone to tunnel to
  -e, --service <service>        The service to tunnel to (default: http://localhost)
  -a, --apiKey <apiKey>          The API key to use
  -i, --accountId <accountId>    The account ID to use
  -h, --help                     Show help
`;

const initHelpMessage = `
Usage:
  tunnler init [options]

Initialize tunnler configuration with Cloudflare credentials.

Options:
  -a, --apiKey <apiKey>          The Cloudflare API key (will prompt if not provided)
  -i, --accountId <accountId>    The Cloudflare account ID (will prompt if not provided)
  -z, --zone <zone>              The default zone to use
  -h, --help                     Show help
`;

// Create a readline interface for prompting
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Helper function to prompt for input
async function prompt(question: string): Promise<string> {
	return new Promise(resolve => {
		rl.question(question, answer => {
			resolve(answer.trim());
		});
	});
}

// Handle init command
if (command === 'init') {
	const initArgs = util.parseArgs({
		args: remainingArgs,
		options: {
			apiKey: {
				type: 'string',
				short: 'a',
			},
			accountId: {
				type: 'string',
				short: 'i',
			},
			zone: {
				type: 'string',
				short: 'z',
			},
			help: {
				type: 'boolean',
				short: 'h',
			},
		},
	});

	if (initArgs.values.help) {
		console.log(initHelpMessage);
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(0);
	}

	let {apiKey, accountId, zone} = initArgs.values;

	// Prompt for API key if not provided
	if (!apiKey) {
		apiKey = await prompt('Enter your Cloudflare API key: ');
		if (!apiKey) {
			throw new Error('API key is required for initialization');
		}
	}

	// Prompt for account ID if not provided
	if (!accountId) {
		accountId = await prompt('Enter your Cloudflare account ID: ');
		if (!accountId) {
			throw new Error('Account ID is required for initialization');
		}
	}

	zone ??= await prompt('Enter your default zone (optional): ');

	// Initialize tunnler
	let file: string | undefined;
	try {
		file = await initCredentials({
			apiKey: apiKey.trim(),
			accountId: accountId.trim(),
			defaultZone: zone?.trim(),
		});
	} catch (error) {
		console.log('❌ Failed to initialize tunnler');
		console.error(error);
	} finally {
		rl.close();
	}

	console.log(`✅ Tunnler initialized successfully at ${file}`);
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0);
}

// Handle help command or no command (show main help)
if (command === 'help' || command === '--help' || command === '-h') {
	console.log(helpMessage);
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0);
}

// Default tunnel command (when no command is specified or command is 'tunnel')
const tunnelArgs = util.parseArgs({
	args: command === 'tunnel' ? remainingArgs : [command, ...remainingArgs],
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

if (tunnelArgs.values.help) {
	console.log(helpMessage);
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0);
}

const port = tunnelArgs.values.port ? Number.parseInt(tunnelArgs.values.port, 10) : undefined;

if (!tunnelArgs.values.port) {
	throw new Error('Port is required');
} else if (Number.isNaN(port) || !port) {
	throw new Error('Port must be a number');
} else if (port < 1 || port > 65_535) {
	throw new Error('Port must be between 1 and 65535');
}

const {subdomain} = tunnelArgs.values;
const {zone} = tunnelArgs.values;
const {service} = tunnelArgs.values;

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
