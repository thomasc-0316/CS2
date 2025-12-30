export function makeRedirectUri({ native, useProxy } = {}) {
  if (native) return native;
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export const ResponseType = {
  IdToken: 'id_token',
  Code: 'code',
  Token: 'token',
};

export default {
  makeRedirectUri,
  ResponseType,
};
