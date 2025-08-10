import crypto from 'node:crypto';

export const uuid = () => crypto.randomUUID();
