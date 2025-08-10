import {type RecordResponse} from 'cloudflare/resources/dns.mjs';
import {getDEFAULT_ZONE} from '../constants.js';
import {getClient} from './cloudflare.js';

const getZoneId = async () => {
	const client = getClient();
	const zones = await client.zones.list();
	const zone = zones.result.find((zone: any) => zone.name === getDEFAULT_ZONE());
	if (!zone) {
		throw new Error(`Zone ${getDEFAULT_ZONE()} not found`);
	}

	return zone.id;
};

export const getRecords = async (_zoneId?: string) => {
	const zoneId = _zoneId ?? (await getZoneId());
	const client = getClient();

	const records = await client.dns.records.list({
		zone_id: zoneId,
	});

	return records.result;
};

type UpsertRecordOptions = {
	name: string;
	content: string;
};

const allowedTypes = ['CNAME', 'A', 'AAAA'] satisfies Array<RecordResponse['type']>;

// Map record type strings to their corresponding RecordResponse types
type RecordTypeMap = {
	A: RecordResponse.ARecord;
	AAAA: RecordResponse.AAAARecord;
	CNAME: RecordResponse.CNAMERecord;
	MX: RecordResponse.MXRecord;
	NS: RecordResponse.NSRecord;
	OPENPGPKEY: RecordResponse.OpenpgpkeyRecord;
	PTR: RecordResponse.PTRRecord;
	TXT: RecordResponse.TXTRecord;
	CAA: RecordResponse.CAARecord;
	CERT: RecordResponse.CERTRecord;
	DNSKEY: RecordResponse.DNSKEYRecord;
	DS: RecordResponse.DSRecord;
	HTTPS: RecordResponse.HTTPSRecord;
	LOC: RecordResponse.LOCRecord;
	NAPTR: RecordResponse.NAPTRRecord;
	SMIMEA: RecordResponse.SMIMEARecord;
	SRV: RecordResponse.SRVRecord;
	SSHFP: RecordResponse.SSHFPRecord;
	SVCB: RecordResponse.SVCBRecord;
	TLSA: RecordResponse.TLSARecord;
	URI: RecordResponse.URIRecord;
};
type AllowedRecord = RecordTypeMap[typeof allowedTypes[number]];

const isAllowedType = (record?: RecordResponse): record is AllowedRecord => {
	if (!record?.type) {
		return false;
	}

	return (allowedTypes as readonly string[]).includes(record.type);
};

export const upsertRecord = async (options: UpsertRecordOptions) => {
	const zoneId = await getZoneId();
	const records = await getRecords(zoneId);
	const existingRecord = records.find((r: any) => r.name === options.name);
	const client = getClient();

	if (existingRecord && !isAllowedType(existingRecord)) {
		throw new Error(`Record type ${existingRecord?.type} is not allowed`);
	}

	if (existingRecord) {
		return client.dns.records.update(zoneId, {
			zone_id: zoneId,
			...existingRecord,
			content: options.content,
		});
	}

	return client.dns.records.create({
		zone_id: zoneId,
		name: options.name,
		content: options.content,
		ttl: 600,
		type: 'CNAME',
		proxied: true,
	});
};

export const deleteRecord = async (name: string) => {
	const zoneId = await getZoneId();
	const records = await getRecords(zoneId);
	const record = records.find((r: any) => r.name === name);
	const client = getClient();
	if (!record) {
		throw new Error(`Record ${name} not found`);
	}

	await client.dns.records.delete(record.id, {
		zone_id: zoneId,
	});
};
