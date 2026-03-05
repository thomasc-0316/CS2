export const MediaTypeOptions = {
  All: 'All',
  Images: 'Images',
  Videos: 'Videos',
};

const denied = { status: 'denied', granted: false, canAskAgain: false };

export async function requestCameraPermissionsAsync() {
  return denied;
}

export async function requestMediaLibraryPermissionsAsync() {
  return denied;
}

export async function launchImageLibraryAsync() {
  return { canceled: true, assets: [] };
}

export async function launchCameraAsync() {
  return { canceled: true, assets: [] };
}

export function useCameraPermissions() {
  return [denied, requestCameraPermissionsAsync] as const;
}

export default {
  MediaTypeOptions,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync,
  launchCameraAsync,
  useCameraPermissions,
};
