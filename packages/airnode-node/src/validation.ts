import { z } from 'zod';

export const apiCallParametersSchema = z.record(z.string());