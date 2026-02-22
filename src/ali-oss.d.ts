declare module 'ali-oss' {
  interface PutOptions {
    headers?: Record<string, string>;
  }

  interface OSSInstance {
    put(
      name: string,
      file: File | Blob | string,
      options?: PutOptions
    ): Promise<{ url: string; name: string }>;
  }

  interface OSSOptions {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
    stsToken?: string;
  }

  function OSS(options: OSSOptions): OSSInstance;

  export default OSS;
}
