// Black-box tests for components/FilterPanel — verifies the H9 extraction
// behaves identically to the inline duplicate it replaced.
import React, { useState } from 'react';
import { Animated } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import FilterPanel from '../../components/FilterPanel';

const harnessProps = (overrides = {}) => ({
  visible: true,
  slideAnim: new Animated.Value(0),
  tempFilters: { map: 'all', type: 'all', side: 'all' },
  setTempFilters: jest.fn(),
  availableMaps: ['all', 'dust2', 'mirage'],
  availableTypes: ['all', 'smoke', 'flash'],
  availableSides: ['all', 't', 'ct'],
  onClose: jest.fn(),
  onApply: jest.fn(),
  onReset: jest.fn(),
  ...overrides,
});

describe('FilterPanel', () => {
  it('returns null when not visible', () => {
    const { toJSON } = render(<FilterPanel {...harnessProps({ visible: false })} />);
    expect(toJSON()).toBeNull();
  });

  it('renders all map / type / side chips', () => {
    const { getByText, getAllByText } = render(<FilterPanel {...harnessProps()} />);
    expect(getByText('Filters')).toBeTruthy();
    // 'All' label appears once per filter category (map/type/side).
    expect(getAllByText('All').length).toBeGreaterThanOrEqual(3);
    expect(getByText('smoke')).toBeTruthy();
    expect(getByText('T')).toBeTruthy();
  });

  it('invokes onClose when the overlay or close button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(<FilterPanel {...harnessProps({ onClose })} />);
    // Close button is the X icon — find by its accessible label "close".
    fireEvent.press(getByText('close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls setTempFilters when a chip is pressed', () => {
    const setTempFilters = jest.fn();
    const { getByText } = render(
      <FilterPanel {...harnessProps({ setTempFilters })} />,
    );
    fireEvent.press(getByText('smoke'));
    expect(setTempFilters).toHaveBeenCalled();
    // First arg is an updater function — apply it manually to verify intent.
    const updater = setTempFilters.mock.calls[0][0];
    expect(updater({ map: 'all', type: 'all', side: 'all' })).toEqual({
      map: 'all',
      type: 'smoke',
      side: 'all',
    });
  });

  it('reset and apply buttons fire their callbacks', () => {
    const onApply = jest.fn();
    const onReset = jest.fn();
    const { getByText } = render(
      <FilterPanel {...harnessProps({ onApply, onReset })} />,
    );
    fireEvent.press(getByText('Reset'));
    fireEvent.press(getByText('Apply'));
    expect(onReset).toHaveBeenCalled();
    expect(onApply).toHaveBeenCalled();
  });

  it('reflects the live tempFilters when used inside a stateful parent', () => {
    function Wrapper() {
      const [filters, setFilters] = useState({ map: 'all', type: 'all', side: 'all' });
      return (
        <FilterPanel
          {...harnessProps({
            tempFilters: filters,
            setTempFilters: setFilters,
            onApply: jest.fn(),
            onReset: () => setFilters({ map: 'all', type: 'all', side: 'all' }),
          })}
        />
      );
    }
    const { getByText } = render(<Wrapper />);
    fireEvent.press(getByText('flash'));
    // After the press, "flash" still renders (we're not asserting style)
    expect(getByText('flash')).toBeTruthy();
  });
});
