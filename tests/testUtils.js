import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render } from '@testing-library/react-native';

export const renderWithProviders = (ui, options = {}) => {
  const { wrapNavigation = true, ...renderOptions } = options;
  const Wrapper = ({ children }) =>
    wrapNavigation ? (
      <NavigationContainer>{children}</NavigationContainer>
    ) : (
      <>{children}</>
    );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));
