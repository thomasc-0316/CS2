export function useAuthRequest() {
  // Return a tuple similar to Expo hook: request, response, promptAsync
  const promptAsync = async () => ({ type: 'dismiss' });
  return [null, null, promptAsync] as const;
}

export default {
  useAuthRequest,
};
