import { z } from 'zod';

export const authSchema = {
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(6)
    })
  }),
  register: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(6)
    })
  })
};
