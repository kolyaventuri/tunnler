import {getCLOUDFLARE_ACCOUNT_ID} from '../constants.js';
import {getClient} from './cloudflare.js';

export const create = async (name: string) => {
	const accountId = getCLOUDFLARE_ACCOUNT_ID();
	if (!accountId) {
		throw new Error('CLOUDLFARE_ACCOUNT_ID is not set');
	}

	const client = getClient();
  const tunnels = await client.zeroTrust.tunnels.cloudflared.list({
    account_id: accountId,
  });

  let tunnel = tunnels.result.find(tunnel => tunnel.name === name);
  if (!tunnel) {
    tunnel = await client.zeroTrust.tunnels.cloudflared.create({
      account_id: accountId,
      name,
    });
  }

	if (!tunnel.id) {
		throw new Error('Failed to create tunnel');
	}

	const token = await client.zeroTrust.tunnels.cloudflared.token.get(tunnel.id, {
		account_id: accountId,
	});

	return {
		token,
		tunnelId: tunnel.id,
	};
};

export const destroy = async (id: string) => {
	const accountId = getCLOUDFLARE_ACCOUNT_ID();
	if (!accountId) {
		throw new Error('CLOUDLFARE_ACCOUNT_ID is not set');
	}

	const client = getClient();
	await client.zeroTrust.tunnels.cloudflared.delete(id, {
		account_id: accountId,
	});
};

type AttachOptions = {
	tunnelId: string;
	domain: string;
	service: string;
};
export const attach = async (options: AttachOptions) => {
	const accountId = getCLOUDFLARE_ACCOUNT_ID();
	if (!accountId) {
		throw new Error('CLOUDLFARE_ACCOUNT_ID is not set');
	}

	const client = getClient();
	return client.zeroTrust.tunnels.cloudflared.configurations.update(options.tunnelId, {
		account_id: accountId,
		config: {
			ingress: [
				{
					hostname: options.domain,
					service: options.service,
					originRequest: {},
				},
				{
					hostname: '*',
					service: 'http_status:404',
				},
			],
		},
	});
};
