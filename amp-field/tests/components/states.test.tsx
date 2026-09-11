import { EmptyState, ErrorState, OfflineBanner, SkeletonCard } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

describe('EmptyState', () => {
  it('explains what belongs here and offers the next action', () => {
    const onPress = jest.fn();
    renderWithProviders(
      <EmptyState
        title="No reports yet"
        message="Daily reports you submit will appear here."
        action={{ label: 'Start Daily Report', onPress }}
      />
    );

    expect(screen.getByText('No reports yet')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Start Daily Report'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ErrorState', () => {
  it('names the action, reassures about data and offers a retry (§61)', () => {
    const onRetry = jest.fn();
    renderWithProviders(
      <ErrorState
        title="We couldn't submit this report"
        message="Your draft is safe on this phone. Check your connection and try again."
        onRetry={onRetry}
      />
    );

    expect(screen.getByText(/Your draft is safe on this phone/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('offers no retry for a fatal error', () => {
    renderWithProviders(
      <ErrorState
        severity="fatal"
        title="AMP Field isn't configured correctly"
        message="Reinstall the latest build."
      />
    );

    expect(screen.queryByText('Try again')).toBeNull();
    expect(screen.getByText('Cannot continue')).toBeOnTheScreen();
    expect(screen.getByText(/isn't configured correctly/)).toBeOnTheScreen();
  });
});

describe('OfflineBanner', () => {
  it('renders nothing while the device is online', () => {
    renderWithProviders(<OfflineBanner />);
    expect(screen.queryByTestId('offline-banner')).toBeNull();
  });

  it('never implies queued work has been delivered', () => {
    renderWithProviders(<OfflineBanner forceOffline queuedCount={2} />);
    const text = screen.getByTestId('offline-banner').props.accessibilityLabel as string;

    expect(text).toContain('2 items are waiting to sync');
    expect(text).not.toMatch(/sent|submitted|delivered/i);
  });

  it('uses singular wording for one queued item', () => {
    renderWithProviders(<OfflineBanner forceOffline queuedCount={1} />);
    expect(screen.getByText(/1 item is waiting to sync/)).toBeOnTheScreen();
  });
});

describe('SkeletonCard', () => {
  it('announces itself as busy rather than leaving a blank screen', () => {
    renderWithProviders(<SkeletonCard />);
    expect(screen.getByTestId('skeleton-card')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });
});
