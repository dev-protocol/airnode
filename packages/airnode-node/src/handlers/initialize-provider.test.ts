import { initializeProvider } from './initialize-provider';
import * as evmHandler from '../evm/handlers/initialize-provider';
import * as fixtures from '../../test/fixtures';

describe('initializeProvider', () => {
  fixtures.setEnvVariables({ AIRNODE_WALLET_PRIVATE_KEY: fixtures.getAirnodeWalletPrivateKey() });

  it('initializes EVM providers', () => {
    const initializeSpy = jest.spyOn(evmHandler, 'initializeProvider');
    const state = fixtures.buildEVMProviderState();
    initializeProvider(state);
    expect(initializeSpy).toHaveBeenCalledTimes(1);
    expect(initializeSpy).toHaveBeenCalledWith(state);
  });
});
