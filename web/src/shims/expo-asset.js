export class Asset {
  constructor({ uri = '', localUri = '' } = {}) {
    this.uri = uri;
    this.localUri = localUri || uri;
  }

  static fromModule(moduleId) {
    const uri = typeof moduleId === 'string' ? moduleId : '';
    return {
      uri,
      localUri: uri,
      downloadAsync: async () => uri,
      width: null,
      height: null,
    };
  }

  static async loadAsync(modules) {
    return (modules || []).map((item) => Asset.fromModule(item));
  }
}

export default { Asset };
