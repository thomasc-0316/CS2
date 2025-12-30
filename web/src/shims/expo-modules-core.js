export const NativeModulesProxy = {};
export const Platform = { OS: 'web', select: (spec = {}) => spec.web ?? spec.default };

export class CodedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export class UnavailabilityError extends Error {}

export function useReleasingSharedObject(value) {
  return value;
}

export function requireNativeModule() {
  return {};
}

export function requireOptionalNativeModule() {
  return null;
}

export default {
  NativeModulesProxy,
  Platform,
  requireNativeModule,
  requireOptionalNativeModule,
  CodedError,
  UnavailabilityError,
  useReleasingSharedObject,
};
