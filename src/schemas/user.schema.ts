import { z } from 'zod';

export const userSchema = {
  create: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email()
    })
  })
};
