import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

export const EnvSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['dev', 'test', 'prod'])
});

export const ENV = EnvSchema.parse(process.env);
