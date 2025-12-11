import crypto from 'crypto';
export const hash = (t: string) => crypto.createHash('sha256').update(t).digest('hex');
