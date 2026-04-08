import { useRef } from 'react';
import { trackRender } from '../services/perfMonitor';

export const useRenderCount = (componentName) => {
  const renderRef = useRef(0);
  renderRef.current += 1;
  trackRender(componentName);
  return renderRef.current;
};
