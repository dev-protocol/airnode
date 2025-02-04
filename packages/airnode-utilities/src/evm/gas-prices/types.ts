import { z } from 'zod';
import { BigNumber, providers } from 'ethers';

export const legacyGasTargetSchema = z.object({
  type: z.literal(0),
  gasPrice: z.instanceof(BigNumber),
  gasLimit: z.instanceof(BigNumber).optional(),
});

export const eip1559GasTargetSchema = z.object({
  type: z.literal(2),
  maxPriorityFeePerGas: z.instanceof(BigNumber),
  maxFeePerGas: z.instanceof(BigNumber),
  gasLimit: z.instanceof(BigNumber).optional(),
});

export const gasTargetSchema = z.discriminatedUnion('type', [legacyGasTargetSchema, eip1559GasTargetSchema]);

export type LegacyGasTarget = z.infer<typeof legacyGasTargetSchema>;
export type Eip1559GasTarget = z.infer<typeof eip1559GasTargetSchema>;
export type GasTarget = z.infer<typeof gasTargetSchema>;
export type Provider = providers.StaticJsonRpcProvider | providers.Provider;
