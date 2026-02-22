/**
 * ========== 请替换为您的阿里云 OSS 配置 ==========
 * 使用方式：STS 临时授权 或 服务端签名后前端直传。
 * 数据命名规则：
 *   - 表单 JSON：memorial_{timestamp}.json
 *   - 照片目录：memorial_{timestamp}/photo_1.jpg, photo_2.jpg ...
 * 未配置时可使用「模拟生成」在本地测试。
 */
export interface OSSConfig {
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  isConfigured: boolean;
}

export const ossConfig: OSSConfig = {
  // region: 'oss-cn-hangzhou',   // 请替换为您的 Region
  // bucket: 'your-bucket-name',  // 请替换为您的 Bucket
  // accessKeyId: '您的 AccessKey ID',
  // 若使用 STS：stsToken、accessKeySecret 由后端接口返回，不要写在前端
  // 若使用签名 URL：由后端生成 put 签名 URL，前端 put 上传
  isConfigured: false,
};
