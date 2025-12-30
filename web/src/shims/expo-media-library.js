export async function requestPermissionsAsync() {
  return { status: 'denied', granted: false, canAskAgain: false };
}

export async function getAssetsAsync() {
  return { assets: [], totalCount: 0, endCursor: null, hasNextPage: false };
}

export async function getAssetInfoAsync() {
  return {};
}

export default {
  requestPermissionsAsync,
  getAssetsAsync,
  getAssetInfoAsync,
};
