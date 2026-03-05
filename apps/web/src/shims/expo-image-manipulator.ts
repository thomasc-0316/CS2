export enum SaveFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
}

export type ManipulateOptions = {
  compress?: number;
  format?: SaveFormat;
};

export async function manipulateAsync(
  uri: string,
  _actions: unknown[] = [],
  _options: ManipulateOptions = {},
) {
  // Web fallback: just echo the uri without manipulating.
  return { uri, width: null, height: null };
}

export default {
  manipulateAsync,
  SaveFormat,
};
