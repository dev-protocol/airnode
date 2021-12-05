import { mockEthers } from '../../../test/mock-utils';

const estimateGasWithdrawalMock = jest.fn();
const fulfillWithdrawalMock = jest.fn();
const getBalanceMock = jest.fn();
mockEthers({
  airnodeRrpMocks: {
    estimateGas: {
      fulfillWithdrawal: estimateGasWithdrawalMock,
    },
    fulfillWithdrawal: fulfillWithdrawalMock,
  },
  ethersMocks: {
    providers: {
      JsonRpcProvider: jest.fn().mockImplementation(() => ({
        getBalance: getBalanceMock,
      })),
    },
  },
});

import { ethers } from 'ethers';
import * as withdrawals from './withdrawals';
import * as fixtures from '../../../test/fixtures';
import { GasTarget, RequestStatus } from '../../types';
import * as wallet from '../wallet';
import { AirnodeRrp } from '../contracts';

const createAirnodeRrpFake = () => new ethers.Contract('address', ['ABI']) as unknown as AirnodeRrp;
const config = fixtures.buildConfig();

const gasPrice = {
  maxPriorityFeePerGas: ethers.BigNumber.from(1),
  maxFeePerGas: ethers.BigNumber.from(1000),
};
const gasPriceFallback = {
  gasPrice: ethers.BigNumber.from('1000'),
};

describe('submitWithdrawal', () => {
  const masterHDNode = wallet.getMasterHDNode(config);

  test.each([gasPrice, gasPriceFallback])(
    `subtracts transaction costs and submits the remaining balance for pending requests - %#`,
    async (gasPrice: GasTarget) => {
      const provider = new ethers.providers.JsonRpcProvider();
      getBalanceMock.mockResolvedValueOnce(ethers.BigNumber.from(250_000_000));
      estimateGasWithdrawalMock.mockResolvedValueOnce(ethers.BigNumber.from(50_000));
      fulfillWithdrawalMock.mockResolvedValueOnce({ hash: '0xsuccessful' });

      const withdrawal = fixtures.requests.buildWithdrawal({ nonce: 5, status: RequestStatus.Pending });
      const options = {
        gasPrice,
        masterHDNode,
        provider,
      };
      const [logs, err, data] = await withdrawals.submitWithdrawal(createAirnodeRrpFake(), withdrawal, options);
      expect(logs).toEqual([
        { level: 'DEBUG', message: `Withdrawal gas limit estimated at 70000 for Request:${withdrawal.id}` },
        {
          level: 'INFO',
          message: `Submitting withdrawal sponsor address:${withdrawal.sponsorAddress} for Request:${withdrawal.id}...`,
        },
      ]);
      expect(err).toEqual(null);
      expect(data).toEqual({ hash: '0xsuccessful' });
      expect(fulfillWithdrawalMock).toHaveBeenCalledTimes(1);
      expect(fulfillWithdrawalMock).toHaveBeenCalledWith(
        withdrawal.id,
        withdrawal.airnodeAddress,
        withdrawal.sponsorAddress,
        {
          ...gasPrice,
          gasLimit: ethers.BigNumber.from(70_000),
          nonce: 5,
          // 250_000_000 - ((50_000 + 20_000) * 1000)
          value: ethers.BigNumber.from(180_000_000),
        }
      );
    }
  );

  test.each([gasPrice, gasPriceFallback])(
    `does nothing if the request is already fulfilled - %#`,
    async (gasPrice: GasTarget) => {
      const provider = new ethers.providers.JsonRpcProvider();
      const withdrawal = fixtures.requests.buildWithdrawal({ nonce: 5, status: RequestStatus.Fulfilled });
      const [logs, err, data] = await withdrawals.submitWithdrawal(createAirnodeRrpFake(), withdrawal, {
        gasPrice,
        masterHDNode,
        provider,
      });
      expect(logs).toEqual([
        {
          level: 'DEBUG',
          message: `Withdrawal sponsor address:${withdrawal.sponsorAddress} for Request:${withdrawal.id} not actioned as it has status:${withdrawal.status}`,
        },
      ]);
      expect(err).toEqual(null);
      expect(data).toEqual(null);
      expect(fulfillWithdrawalMock).not.toHaveBeenCalled();
    }
  );

  test.each([gasPrice, gasPriceFallback])(
    `does nothing if the request is blocked or errored - %#`,
    async (gasPrice: GasTarget) => {
      const provider = new ethers.providers.JsonRpcProvider();
      // NOTE: a withdrawal should not be able to become "errored" or "blocked", but this
      // is just in case that changes
      const blocked = fixtures.requests.buildWithdrawal({ status: RequestStatus.Blocked });
      const errored = fixtures.requests.buildWithdrawal({ status: RequestStatus.Errored });

      const blockedRes = await withdrawals.submitWithdrawal(createAirnodeRrpFake(), blocked, {
        gasPrice,
        masterHDNode,
        provider,
      });
      const erroredRes = await withdrawals.submitWithdrawal(createAirnodeRrpFake(), errored, {
        gasPrice,
        masterHDNode,
        provider,
      });

      expect(blockedRes[0]).toEqual([
        {
          level: 'INFO',
          message: `Withdrawal sponsor address:${blocked.sponsorAddress} for Request:${blocked.id} not actioned as it has status:${blocked.status}`,
        },
      ]);
      expect(blockedRes[1]).toEqual(null);
      expect(blockedRes[2]).toEqual(null);
      expect(erroredRes[0]).toEqual([
        {
          level: 'INFO',
          message: `Withdrawal sponsor address:${errored.sponsorAddress} for Request:${errored.id} not actioned as it has status:${errored.status}`,
        },
      ]);
      expect(erroredRes[1]).toEqual(null);
      expect(erroredRes[2]).toEqual(null);
      expect(fulfillWithdrawalMock).not.toHaveBeenCalled();
    }
  );

  test.each([gasPrice, gasPriceFallback])(
    `does nothing if the withdrawal amount would be negative - %#`,
    async (gasPrice: GasTarget) => {
      const provider = new ethers.providers.JsonRpcProvider();
      getBalanceMock.mockResolvedValueOnce(ethers.BigNumber.from(50_000_000));
      estimateGasWithdrawalMock.mockResolvedValueOnce(ethers.BigNumber.from(50_000));
      const withdrawal = fixtures.requests.buildWithdrawal({ nonce: 5, status: RequestStatus.Pending });
      const options = {
        gasPrice,
        masterHDNode,
        provider,
      };
      const [logs, err, data] = await withdrawals.submitWithdrawal(createAirnodeRrpFake(), withdrawal, options);
      expect(logs).toEqual([
        { level: 'DEBUG', message: `Withdrawal gas limit estimated at 70000 for Request:${withdrawal.id}` },
        {
          level: 'INFO',
          message: `Unable to submit negative withdrawal amount for Request:withdrawalId. Amount: -0.00000000002 ETH`,
        },
      ]);
      expect(err).toEqual(null);
      expect(data).toEqual(null);
      expect(fulfillWithdrawalMock).not.toHaveBeenCalled();
    }
  );

  test.each([gasPrice, gasPriceFallback])(
    `does nothing if the withdrawal does not have a nonce - %#`,
    async (gasPrice: GasTarget) => {
      const provider = new ethers.providers.JsonRpcProvider();
      const withdrawal = fixtures.requests.buildWithdrawal({ nonce: undefined, status: RequestStatus.Pending });
      const options = {
        gasPrice,
        masterHDNode,
        provider,
      };
      const [logs, err, data] = await withdrawals.submitWithdrawal(createAirnodeRrpFake(), withdrawal, options);
      expect(logs).toEqual([
        {
          level: 'ERROR',
          message: `Withdrawal sponsor address:${withdrawal.sponsorAddress} for Request:${withdrawal.id} cannot be submitted as it does not have a nonce`,
        },
      ]);
      expect(err).toEqual(null);
      expect(data).toEqual(null);
      expect(fulfillWithdrawalMock).not.toHaveBeenCalled();
    }
  );

  test.each([gasPrice, gasPriceFallback])(
    `returns an error if the current balance cannot be fetched - %#`,
    async (gasPrice: GasTarget) => {
      const provider = new ethers.providers.JsonRpcProvider();
      getBalanceMock.mockRejectedValueOnce(new Error('Could not fetch balance'));
      getBalanceMock.mockRejectedValueOnce(new Error('Could not fetch balance'));
      const withdrawal = fixtures.requests.buildWithdrawal({ nonce: 5, status: RequestStatus.Pending });
      const options = {
        gasPrice,
        masterHDNode,
        provider,
      };
      const [logs, err, data] = await withdrawals.submitWithdrawal(createAirnodeRrpFake(), withdrawal, options);
      expect(logs).toEqual([
        {
          level: 'ERROR',
          message: `Failed to fetch sponsor address:${withdrawal.sponsorAddress} balance for Request:${withdrawal.id}`,
          error: new Error('Could not fetch balance'),
        },
      ]);
      expect(err).toEqual(new Error('Could not fetch balance'));
      expect(data).toEqual(null);
      expect(fulfillWithdrawalMock).not.toHaveBeenCalled();
    }
  );

  test.each([gasPrice, gasPriceFallback])(
    `returns an error if the estimate gas limit call fails - %#`,
    async (gasPrice: GasTarget) => {
      const provider = new ethers.providers.JsonRpcProvider();
      getBalanceMock.mockResolvedValueOnce(ethers.BigNumber.from(250_000_000));
      estimateGasWithdrawalMock.mockRejectedValueOnce(new Error('Server did not respond'));
      estimateGasWithdrawalMock.mockRejectedValueOnce(new Error('Server did not respond'));
      const withdrawal = fixtures.requests.buildWithdrawal({ nonce: 5, status: RequestStatus.Pending });
      const options = {
        gasPrice,
        masterHDNode,
        provider,
      };
      const [logs, err, data] = await withdrawals.submitWithdrawal(createAirnodeRrpFake(), withdrawal, options);
      expect(logs).toEqual([
        {
          level: 'ERROR',
          message: `Error estimating withdrawal gas limit for Request:${withdrawal.id}`,
          error: new Error('Server did not respond'),
        },
      ]);
      expect(err).toEqual(new Error('Server did not respond'));
      expect(data).toEqual(null);
      expect(fulfillWithdrawalMock).not.toHaveBeenCalled();
    }
  );

  test.each([gasPrice, gasPriceFallback])(
    `returns an error if the withdrawal fails to submit - %#`,
    async (gasPrice: GasTarget) => {
      const provider = new ethers.providers.JsonRpcProvider();
      getBalanceMock.mockResolvedValueOnce(ethers.BigNumber.from(250_000_000));
      estimateGasWithdrawalMock.mockResolvedValueOnce(ethers.BigNumber.from(50_000));
      fulfillWithdrawalMock.mockRejectedValueOnce(new Error('Could not submit withdrawal'));
      fulfillWithdrawalMock.mockRejectedValueOnce(new Error('Could not submit withdrawal'));
      const withdrawal = fixtures.requests.buildWithdrawal({ nonce: 5, status: RequestStatus.Pending });
      const options = {
        gasPrice,
        masterHDNode,
        provider,
      };
      const [logs, err, data] = await withdrawals.submitWithdrawal(createAirnodeRrpFake(), withdrawal, options);
      expect(logs).toEqual([
        { level: 'DEBUG', message: `Withdrawal gas limit estimated at 70000 for Request:${withdrawal.id}` },
        {
          level: 'INFO',
          message: `Submitting withdrawal sponsor address:${withdrawal.sponsorAddress} for Request:${withdrawal.id}...`,
        },
        {
          level: 'ERROR',
          message: `Error submitting sponsor address:${withdrawal.sponsorAddress} withdrawal for Request:${withdrawal.id}`,
          error: new Error('Could not submit withdrawal'),
        },
      ]);
      expect(err).toEqual(new Error('Could not submit withdrawal'));
      expect(data).toEqual(null);
      expect(fulfillWithdrawalMock).toHaveBeenCalledTimes(2);
      expect(fulfillWithdrawalMock).toHaveBeenCalledWith(
        withdrawal.id,
        withdrawal.airnodeAddress,
        withdrawal.sponsorAddress,
        {
          ...gasPrice,
          gasLimit: ethers.BigNumber.from(70_000),
          nonce: 5,
          // 250_000_000 - ((50_000 + 20_000) * 1000)
          value: ethers.BigNumber.from(180_000_000),
        }
      );
    }
  );
});
