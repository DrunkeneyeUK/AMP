import { SiteCard } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

describe('SiteCard', () => {
  it('shows site, address and assignment context', () => {
    renderWithProviders(
      <SiteCard
        siteName="Riverside Logistics Park"
        addressSummary="Riverside Way, Leeds, LS10 1AB"
        projectName="Riverside Fit-Out"
        customerName="Northern Developments"
        workAreaName="Zone B"
        status={{ label: 'Active', tone: 'success' }}
      />
    );

    expect(screen.getByText('Riverside Logistics Park')).toBeOnTheScreen();
    expect(screen.getByText('Riverside Way, Leeds, LS10 1AB')).toBeOnTheScreen();
    expect(screen.getByText('Riverside Fit-Out · Northern Developments')).toBeOnTheScreen();
    expect(screen.getByText('Zone B')).toBeOnTheScreen();
  });

  it('is pressable when an action is supplied', () => {
    const onPress = jest.fn();
    renderWithProviders(<SiteCard siteName="Riverside" addressSummary="Leeds" onPress={onPress} />);

    fireEvent.press(screen.getByLabelText('Riverside, Leeds'));
    expect(onPress).toHaveBeenCalled();
  });
});
