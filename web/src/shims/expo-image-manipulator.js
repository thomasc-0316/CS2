export async function manipulateAsync(uri, actions = [], options = {}) {
  return {
    uri,
    base64: null,
    width: options.width || null,
    height: options.height || null,
  };
}

export const SaveFormat = {
  PNG: 'png',
  JPEG: 'jpeg',
  WEBP: 'webp',
};

export default { manipulateAsync };
