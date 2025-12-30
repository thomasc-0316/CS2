export function maybeCompleteAuthSession() {
  return null;
}

export async function openBrowserAsync(url) {
  if (typeof window !== 'undefined' && url) {
    window.open(url, '_blank');
  }
  return { type: 'opened' };
}

export default {
  maybeCompleteAuthSession,
  openBrowserAsync,
};
