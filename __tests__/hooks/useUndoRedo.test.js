import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useUndoRedo } from '../../hooks/useUndoRedo';

const Harness = React.forwardRef(({ initialState, maxHistory = 50 }, ref) => {
  const hook = useUndoRedo(initialState, maxHistory);
  React.useImperativeHandle(ref, () => hook, [hook]);
  return null;
});

describe('useUndoRedo', () => {
  it('tracks history and supports undo/redo', () => {
    const ref = React.createRef();
    render(<Harness ref={ref} initialState={{ count: 0 }} />);

    act(() => {
      ref.current.setState({ count: 1 });
    });
    act(() => {
      ref.current.setState({ count: 2 });
    });

    expect(ref.current.state.count).toBe(2);
    expect(ref.current.canUndo).toBe(true);
    expect(ref.current.canRedo).toBe(false);

    act(() => {
      ref.current.undo();
    });

    expect(ref.current.state.count).toBe(1);
    expect(ref.current.canRedo).toBe(true);

    act(() => {
      ref.current.redo();
    });

    expect(ref.current.state.count).toBe(2);
  });

  it('respects max history size', () => {
    const ref = React.createRef();
    render(<Harness ref={ref} initialState={{ count: 0 }} maxHistory={2} />);

    act(() => {
      ref.current.setState({ count: 1 });
    });
    act(() => {
      ref.current.setState({ count: 2 });
    });
    act(() => {
      ref.current.setState({ count: 3 });
    });

    expect(ref.current.state.count).toBe(3);

    act(() => {
      ref.current.undo();
    });

    expect(ref.current.state.count).toBe(2);
    expect(ref.current.canUndo).toBe(false);
  });

  it('clears history', () => {
    const ref = React.createRef();
    render(<Harness ref={ref} initialState={{ count: 0 }} />);

    act(() => {
      ref.current.setState({ count: 1 });
    });

    expect(ref.current.canUndo).toBe(true);

    act(() => {
      ref.current.clearHistory();
    });

    expect(ref.current.canUndo).toBe(false);
  });
});
