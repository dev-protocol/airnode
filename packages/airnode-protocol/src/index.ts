/**
 * This package is integrated with https://github.com/ethereum-ts/TypeChain which generates TS
 * bindings and wrappers for ethers wallet (version 5). TypeChain generates two important pieces for
 * each solidity contract:
 *  1) Factories - (e.g. AirnodeRrpV0Factory) are used to connect to ethers Signer and deploy the
 *     contract (or just connect to an already deployed contract instance). You will get a strongly
 *     typed contract instance in return.
 *  2) Typed contracts - These are returned after deployed via contract Factory. It allows you to
 *     call functions, mapping and transactions in type safe manner.
 *
 * The generated code "value exports" the factories, but "type exports" the contracts.
 */
import { ethers } from 'ethers';
import {
  MockRrpRequesterV0__factory as MockRrpRequesterFactory,
  AirnodeRrpV0__factory as AirnodeRrpV0Factory,
  AccessControlRegistry__factory as AccessControlRegistryFactory,
  RequesterAuthorizerWithAirnode__factory as RequesterAuthorizerWithAirnodeFactory,
  RrpBeaconServerV0__factory as RrpBeaconServerV0Factory,
} from './contracts';
import references from '../deployments/references.json';

const AirnodeRrpAddresses: { [chainId: string]: string } = references.AirnodeRrpV0;
const AccessControlRegistryAddresses: { [chainId: string]: string } = references.AccessControlRegistry;
const RequesterAuthorizerWithAirnodeAddresses: { [chainId: string]: string } =
  references.RequesterAuthorizerWithAirnode;
const networks: { [chainId: string]: ethers.providers.Network } = references.networks;

const PROTOCOL_IDS = {
  RRP: '1',
  PSP: '2',
  RELAYED_RRP: '3',
  RELAYED_PSP: '4',
  AIRSEEKER: '5',
  AIRKEEPER: '12345',
};

const mocks = {
  MockRrpRequesterFactory,
};
const authorizers = {
  RequesterAuthorizerWithAirnodeFactory,
};

export {
  AirnodeRrpAddresses,
  AccessControlRegistryAddresses,
  RequesterAuthorizerWithAirnodeAddresses,
  AirnodeRrpV0Factory,
  AccessControlRegistryFactory,
  RrpBeaconServerV0Factory,
  mocks,
  authorizers,
  networks,
  PROTOCOL_IDS,
};

export type {
  AirnodeRrpV0,
  MockRrpRequesterV0,
  AccessControlRegistry,
  RequesterAuthorizerWithAirnode,
  RrpBeaconServerV0,
} from './contracts';

export {
  MadeTemplateRequestEvent,
  MadeFullRequestEvent,
  FulfilledRequestEvent,
  FailedRequestEvent,
  RequestedWithdrawalEvent,
  FulfilledWithdrawalEvent,
} from './contracts/rrp/AirnodeRrpV0'; // eslint-disable-line import/no-unresolved
// NOTE: there seems to be an issue with eslint-plugin-import
// not being able to find the above files. Hopefully a future version (> 2.26.0)
// fixes this. https://github.com/api3dao/airnode/pull/1004#issuecomment-1096152730

export { TypedEventFilter } from './contracts/common';
