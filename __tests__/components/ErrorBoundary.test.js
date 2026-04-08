// Black-box tests for components/ErrorBoundary — drives the boundary
// through its render contract without inspecting internals.
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '../../components/ErrorBoundary';

const Bomb = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <Text>safe</Text>;
};

describe('ErrorBoundary', () => {
  // Suppress noisy React error logging during these tests.
  let errSpy;
  beforeEach(() => {
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(getByText('safe')).toBeTruthy();
  });

  it('catches a thrown error and renders the fallback UI', () => {
    const { getByTestId, getByText } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByText('Something went wrong.')).toBeTruthy();
    expect(getByText(/boom/)).toBeTruthy();
  });

  it('forwards the error to the onError prop when supplied', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe('boom');
  });

  it('renders a custom fallback when supplied', () => {
    const fallback = ({ error }) => <Text>custom: {error.message}</Text>;
    const { getByText } = render(
      <ErrorBoundary fallback={fallback}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(getByText('custom: boom')).toBeTruthy();
  });

  it('reset button clears the error state', () => {
    // After resetting, the next render of children must not throw, so we
    // toggle Bomb via a parent state holder.
    function Wrapper() {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <ErrorBoundary
          fallback={({ reset }) => (
            <Text
              testID="reset"
              onPress={() => {
                setShouldThrow(false);
                reset();
              }}
            >
              tap-to-reset
            </Text>
          )}
        >
          <Bomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }
    const { getByTestId, getByText } = render(<Wrapper />);
    fireEvent.press(getByTestId('reset'));
    expect(getByText('safe')).toBeTruthy();
  });
});
