import { WorkerOptions } from '../../../src/types';

export function buildWorkerOptions(options?: Partial<WorkerOptions>): WorkerOptions {
  return {
    cloudProvider: 'local',
    airnodeIdShort: '19255a4',
    region: 'us-east-1',
    stage: 'test',
    ...options,
  };
}
