import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useAutoSave } from '../../hooks/useAutoSave';

const mockSaveDraft = jest.fn();

jest.mock('../../context/DraftsContext', () => ({
  useDrafts: () => ({
    saveDraft: mockSaveDraft,
  }),
}));

const Harness = React.forwardRef(({ formData, enabled = true }, ref) => {
  const hook = useAutoSave(formData, enabled);
  React.useImperativeHandle(ref, () => hook, [hook]);
  return null;
});

const emptyForm = {
  title: '',
  description: '',
  side: '',
  site: '',
  nadeType: '',
  throwInstructions: '',
  standImage: null,
  aimImage: null,
  landImage: null,
  thirdPersonImage: null,
};

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSaveDraft.mockResolvedValue('draft_1');
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('does not save when form is empty', async () => {
    const ref = React.createRef();
    render(<Harness ref={ref} formData={emptyForm} enabled />);

    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    expect(mockSaveDraft).not.toHaveBeenCalled();
  });

  it('saves after debounce when form changes', async () => {
    const ref = React.createRef();
    const { rerender } = render(
      <Harness ref={ref} formData={emptyForm} enabled />
    );

    const filledForm = {
      ...emptyForm,
      title: 'New lineup',
      side: 'T',
    };

    rerender(<Harness ref={ref} formData={filledForm} enabled />);

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(mockSaveDraft).toHaveBeenCalled();
    expect(ref.current.saveStatus).toBe('saved');
  });

  it('forceSave returns false for empty form', async () => {
    const ref = React.createRef();
    render(<Harness ref={ref} formData={emptyForm} enabled />);

    await act(async () => {
      const result = await ref.current.forceSave();
      expect(result).toBe(false);
    });
  });
});
