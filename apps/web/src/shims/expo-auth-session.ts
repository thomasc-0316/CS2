export function makeRedirectUri(_options?: { useProxy?: boolean }) {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost';
}

export async function startAsync() {
  return { type: 'dismiss' };
}

export default {
  makeRedirectUri,
  startAsync,
};
