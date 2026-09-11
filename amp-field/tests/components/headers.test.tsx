import { AppTextArea, ScreenHeader, SectionHeader } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

describe('ScreenHeader', () => {
  it('marks the title as a heading for screen readers', () => {
    renderWithProviders(<ScreenHeader title="Daily Reports" subtitle="Riverside Logistics Park" />);

    expect(screen.getByRole('header', { name: 'Daily Reports' })).toBeOnTheScreen();
    expect(screen.getByText('Riverside Logistics Park')).toBeOnTheScreen();
  });

  it('offers a labelled back action only when one is supplied', () => {
    const onBack = jest.fn();
    const { rerender } = renderWithProviders(<ScreenHeader title="Site Info" />);
    expect(screen.queryByLabelText('Go back')).toBeNull();

    rerender(<ScreenHeader title="Site Info" onBack={onBack} />);
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('SectionHeader', () => {
  it('renders an optional action', () => {
    const onPress = jest.fn();
    renderWithProviders(
      <SectionHeader title="Needs attention" action={{ label: 'See all', onPress }} />
    );

    fireEvent.press(screen.getByText('See all'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('AppTextArea', () => {
  it('accepts multi-line input', () => {
    const onChangeText = jest.fn();
    renderWithProviders(
      <AppTextArea label="Work completed" value="" onChangeText={onChangeText} rows={5} />
    );

    const field = screen.getByLabelText('Work completed');
    expect(field.props.multiline).toBe(true);

    fireEvent.changeText(field, 'Installed containment in Zone B.');
    expect(onChangeText).toHaveBeenCalledWith('Installed containment in Zone B.');
  });
});
