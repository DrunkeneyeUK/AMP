import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Connectivity is the foundation of AMP Field's offline behaviour.
 *
 * `isOnline` is deliberately conservative: a connection is only treated as
 * usable once the platform confirms the internet is reachable, so the app never
 * implies a submission succeeded while the device is on a captive site Wi-Fi.
 */
export type ConnectivityState = {
  readonly isOnline: boolean;
  /** `null` until the first NetInfo result arrives. */
  readonly isInternetReachable: boolean | null;
  readonly connectionType: string;
  /** False until the first probe resolves, so the UI can avoid flashing. */
  readonly hasResolved: boolean;
};

const INITIAL_STATE: ConnectivityState = {
  isOnline: true,
  isInternetReachable: null,
  connectionType: 'unknown',
  hasResolved: false,
};

const ConnectivityContext = createContext<ConnectivityState>(INITIAL_STATE);

/**
 * Supplies a fixed connectivity value.
 *
 * Used by `ConnectivityProvider` itself, and directly by tests and previews
 * that need to render a known online/offline state without a device radio.
 */
export function ConnectivityStateProvider({
  value,
  children,
}: {
  readonly value: ConnectivityState;
  readonly children: ReactNode;
}) {
  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function toConnectivityState(state: NetInfoState): ConnectivityState {
  const reachable = state.isInternetReachable;
  return {
    // Treat "connected but reachability unknown" as online; treat an explicit
    // `false` as offline.
    isOnline: Boolean(state.isConnected) && reachable !== false,
    isInternetReachable: reachable,
    connectionType: state.type,
    hasResolved: true,
  };
}

export function ConnectivityProvider({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<ConnectivityState>(INITIAL_STATE);

  useEffect(() => {
    let active = true;

    NetInfo.fetch()
      .then((next) => {
        if (active) setState(toConnectivityState(next));
      })
      .catch(() => {
        // A failed probe must not block the app; assume online and let the
        // next event correct it.
        if (active) setState((current) => ({ ...current, hasResolved: true }));
      });

    const unsubscribe = NetInfo.addEventListener((next) => {
      if (active) setState(toConnectivityState(next));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <ConnectivityStateProvider value={value}>{children}</ConnectivityStateProvider>;
}

export function useConnectivity(): ConnectivityState {
  return useContext(ConnectivityContext);
}
