import { toConnectivityState } from '@/lib/sync/connectivity';
import type { NetInfoState } from '@react-native-community/netinfo';

function netInfo(partial: Partial<NetInfoState>): NetInfoState {
  return {
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: null,
    ...partial,
  } as NetInfoState;
}

describe('toConnectivityState', () => {
  it('is online when connected and reachable', () => {
    expect(toConnectivityState(netInfo({})).isOnline).toBe(true);
  });

  it('is offline when the device has no connection', () => {
    expect(toConnectivityState(netInfo({ isConnected: false })).isOnline).toBe(false);
  });

  it('is offline on a captive network where the internet is explicitly unreachable', () => {
    expect(toConnectivityState(netInfo({ isInternetReachable: false })).isOnline).toBe(false);
  });

  it('stays online while reachability is still unknown', () => {
    expect(toConnectivityState(netInfo({ isInternetReachable: null })).isOnline).toBe(true);
  });

  it('records that the first probe has resolved', () => {
    expect(toConnectivityState(netInfo({})).hasResolved).toBe(true);
  });
});
