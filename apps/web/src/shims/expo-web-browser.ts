export async function openAuthSessionAsync(url: string) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
  return { type: 'opened' };
}

export async function openBrowserAsync(url: string) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
  return { type: 'opened' };
}

export default {
  openAuthSessionAsync,
  openBrowserAsync,
};
