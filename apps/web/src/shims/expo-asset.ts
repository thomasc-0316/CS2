export class Asset {
  // Mimic the minimal surface needed by Asset.fromModule
  uri: string;

  constructor(uri: string) {
    this.uri = uri;
  }

  static fromModule(mod: string | { uri: string }) {
    const uri = typeof mod === 'string' ? mod : mod?.uri || '';
    const asset = new Asset(uri);
    // Provide fields the app checks for
    // @ts-expect-error we align with RN Asset shape loosely
    asset.localUri = uri;
    return asset;
  }
}

export default { Asset };
