import { useEffect, useState } from 'react';

import { getEnvResult } from '@/lib/env';

export type BootstrapState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready' }
  | { readonly status: 'fatal'; readonly issues: readonly string[] };

/**
 * Resolves everything the shell needs before the first screen can be shown.
 *
 * Phase 0 PR #1 resolves configuration only. Session restoration and
 * organisation membership join this sequence in PR #2, which is why the result
 * is modelled as a state machine rather than a boolean.
 */
export function useAppBootstrap(): BootstrapState {
  const [state, setState] = useState<BootstrapState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    // Configuration resolves synchronously today. PR #2 adds session
    // restoration and membership loading to this sequence, both of which are
    // asynchronous, so the result is delivered through a callback from the
    // start rather than reshaping the hook later.
    void Promise.resolve().then(() => {
      if (!active) return;
      const result = getEnvResult();
      setState(result.ok ? { status: 'ready' } : { status: 'fatal', issues: result.issues });
    });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
