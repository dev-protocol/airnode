/* eslint-disable functional/prefer-readonly-type */

import { Endpoint, Method, OIS, Operation, SecuritySchemeSecret } from '@api3/ois';
import { BigNumber } from 'bignumber.js';

export type BuildRequestOptions = {
  readonly ois: OIS;
  readonly endpointName: string;
  readonly parameters: { readonly [key: string]: string };
  readonly securitySchemeSecrets?: SecuritySchemeSecret[];
};

export type CachedBuildRequestOptions = BuildRequestOptions & {
  readonly operation: Operation;
  readonly endpoint: Endpoint;
};

export type Parameters = {
  readonly [key: string]: string;
};

export type RequestParameters = {
  readonly paths: { [key: string]: string };
  readonly query: { [key: string]: string };
  readonly headers: { [key: string]: string };
};

export type BuilderParameters = RequestParameters & {
  readonly cookies: { [key: string]: string };
};

export type Request = {
  readonly baseUrl: string;
  readonly path: string;
  readonly method: Method;
  readonly headers: { [key: string]: string };
  readonly data: { [key: string]: string };
};

export type Config = {
  readonly timeout?: number;
};

export type ValueType = string | BigNumber | boolean;

export type ResponseType = 'uint256' | 'int256' | 'bool' | 'bytes32';

export type ReservedParameters = {
  readonly _path?: string;
  readonly _times?: string | BigNumber;
  readonly _type: ResponseType;
  readonly _relay_metadata?: string;
};
