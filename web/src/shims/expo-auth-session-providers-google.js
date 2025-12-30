import { useMemo, useState } from 'react';

export function useIdTokenAuthRequest(config = {}) {
  const [response, setResponse] = useState(null);

  const request = useMemo(() => ({ config }), [config]);

  const promptAsync = async () => {
    console.warn('Google auth is not available in the web shim.'); // eslint-disable-line no-console
    const next = { type: 'dismiss', error: 'unavailable' };
    setResponse(next);
    return next;
  };

  return [request, response, promptAsync];
}

export default {
  useIdTokenAuthRequest,
};
