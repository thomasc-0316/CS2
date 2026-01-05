export async function requestPermissionsAsync() {
  return { status: 'denied', granted: false, canAskAgain: false };
}

export async function getAssetsAsync() {
  return { assets: [] };
}

export default {
  requestPermissionsAsync,
  getAssetsAsync,
};
