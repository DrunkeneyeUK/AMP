import NetInfo from '@react-native-community/netinfo';
import { Text } from 'react-native';

import { ConnectivityProvider, useConnectivity } from '@/lib/sync';
import { act, render, screen, waitFor } from '@testing-library/react-native';

function Probe() {
  const { isOnline, hasResolved } = useConnectivity();
  return (
    <Text>{`${hasResolved ? 'resolved' : 'pending'}:${isOnline ? 'online' : 'offline'}`}</Text>
  );
}

describe('ConnectivityProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports the first probe result', async () => {
    jest
      .mocked(NetInfo.fetch)
      .mockResolvedValue({ isConnected: false, isInternetReachable: false, type: 'none' } as never);

    render(
      <ConnectivityProvider>
        <Probe />
      </ConnectivityProvider>
    );

    await waitFor(() => expect(screen.getByText('resolved:offline')).toBeOnTheScreen());
  });

  it('follows later connectivity changes', async () => {
    let listener: ((state: unknown) => void) | undefined;
    jest.mocked(NetInfo.addEventListener).mockImplementation(((next: (state: unknown) => void) => {
      listener = next;
      return jest.fn();
    }) as never);
    jest
      .mocked(NetInfo.fetch)
      .mockResolvedValue({ isConnected: true, isInternetReachable: true, type: 'wifi' } as never);

    render(
      <ConnectivityProvider>
        <Probe />
      </ConnectivityProvider>
    );

    await waitFor(() => expect(screen.getByText('resolved:online')).toBeOnTheScreen());

    act(() => {
      listener?.({ isConnected: true, isInternetReachable: false, type: 'wifi' });
    });

    expect(screen.getByText('resolved:offline')).toBeOnTheScreen();
  });

  it('does not block the app when the probe fails', async () => {
    jest.mocked(NetInfo.fetch).mockRejectedValue(new Error('radio unavailable') as never);

    render(
      <ConnectivityProvider>
        <Probe />
      </ConnectivityProvider>
    );

    await waitFor(() => expect(screen.getByText('resolved:online')).toBeOnTheScreen());
  });

  it('unsubscribes on unmount', async () => {
    const unsubscribe = jest.fn();
    jest.mocked(NetInfo.addEventListener).mockReturnValue(unsubscribe as never);

    const view = render(
      <ConnectivityProvider>
        <Probe />
      </ConnectivityProvider>
    );

    await waitFor(() => expect(screen.getByText(/resolved/)).toBeOnTheScreen());
    view.unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
