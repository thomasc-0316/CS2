import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import LoginScreen from '../../screens/LoginScreen';

const mockLogin = jest.fn();
const mockLoginWithGoogle = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithGoogle: mockLoginWithGoogle,
  }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an error when fields are missing', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { navigate: jest.fn() };

    const { getByText } = render(<LoginScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.press(getByText('Log In'));
    });

    expect(alertSpy).toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login when email and password provided', async () => {
    const navigation = { navigate: jest.fn() };
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret');

    await act(async () => {
      fireEvent.press(getByText('Log In'));
    });

    expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'secret');
  });
});
