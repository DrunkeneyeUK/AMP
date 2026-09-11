import { AppInput, AppSelect } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

describe('AppInput', () => {
  it('labels the field for screen readers', () => {
    renderWithProviders(<AppInput label="Email" value="" onChangeText={jest.fn()} />);
    expect(screen.getByLabelText('Email')).toBeOnTheScreen();
  });

  it('announces validation errors', () => {
    renderWithProviders(
      <AppInput
        label="Email"
        value="alex"
        onChangeText={jest.fn()}
        error="Enter a valid email address"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address');
  });

  it('shows the hint when there is no error', () => {
    renderWithProviders(
      <AppInput label="Quantity" value="" onChangeText={jest.fn()} hint="Optional" />
    );

    expect(screen.getByText('Optional')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('reports changes', () => {
    const onChangeText = jest.fn();
    renderWithProviders(<AppInput label="Email" value="" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'alex@contractor.co.uk');
    expect(onChangeText).toHaveBeenCalledWith('alex@contractor.co.uk');
  });
});

describe('AppSelect', () => {
  const OPTIONS = [
    { value: 'materials', label: 'Materials' },
    { value: 'access', label: 'Access' },
  ] as const;

  it('shows the placeholder until a value is chosen', () => {
    renderWithProviders(
      <AppSelect label="Category" value={null} options={OPTIONS} onChange={jest.fn()} />
    );

    expect(screen.getByText('Select an option')).toBeOnTheScreen();
  });

  it('lets a value be selected from the sheet', () => {
    const onChange = jest.fn();
    renderWithProviders(
      <AppSelect
        label="Category"
        value={null}
        options={OPTIONS}
        onChange={onChange}
        testID="category"
      />
    );

    fireEvent.press(screen.getByTestId('category'));
    fireEvent.press(screen.getByText('Materials'));

    expect(onChange).toHaveBeenCalledWith('materials');
  });

  it('exposes the current value to assistive technology', () => {
    renderWithProviders(
      <AppSelect
        label="Category"
        value="access"
        options={OPTIONS}
        onChange={jest.fn()}
        testID="category"
      />
    );

    expect(screen.getByTestId('category').props.accessibilityValue.text).toBe('Access');
  });
});
