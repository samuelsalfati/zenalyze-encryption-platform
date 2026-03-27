import { randomBytes } from 'crypto';

export function generateDataId(): string {
  return `data_${randomBytes(12).toString('hex')}`;
}
