/**
 * 阿里云 OSS 配置
 * 密钥请写在 .env.local 中（已加入 .gitignore），不要提交到仓库：
 *   REACT_APP_OSS_ACCESS_KEY_ID=你的AccessKeyId
 *   REACT_APP_OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
 */
export interface OSSConfig {
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  publicBaseUrl?: string;
  isConfigured: boolean;
}

const accessKeyId = process.env.REACT_APP_OSS_ACCESS_KEY_ID;
const accessKeySecret = process.env.REACT_APP_OSS_ACCESS_KEY_SECRET;

export const ossConfig: OSSConfig = {
  region: 'oss-cn-beijing',
  bucket: 'memorial-an',
  accessKeyId: accessKeyId || undefined,
  accessKeySecret: accessKeySecret || undefined,
  publicBaseUrl: 'https://memorial-an.oss-cn-beijing.aliyuncs.com',
  isConfigured: Boolean(accessKeyId && accessKeySecret),
};
