import OSS from 'ali-oss';
import type { MemorialData } from './types';
import { ossConfig } from './ossConfig';

interface OSSClient {
  put(name: string, file: File | Blob, options?: { headers?: Record<string, string> }): Promise<{ url: string }>;
}

function getClient(): OSSClient {
  const { region, bucket, accessKeyId, accessKeySecret } = ossConfig;
  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    throw new Error('OSS 配置不完整：缺少 region / bucket / accessKeyId / accessKeySecret');
  }
  // ali-oss 在运行时支持 new OSS(options)
  return new (OSS as unknown as new (opts: Record<string, unknown>) => OSSClient)({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
  });
}

function getFileExt(name: string): string {
  const i = name.lastIndexOf('.');
  if (i >= 0) return name.slice(i).toLowerCase();
  return '.jpg';
}

/**
 * 上传纪念页：先传照片到 {id}/photo_1.xxx，再传 JSON 到 {id}.json
 */
export async function uploadMemorial(
  id: string,
  payload: Omit<MemorialData, 'photoUrls'> & { photoFiles?: File[] },
): Promise<void> {
  const client = getClient();
  const photoUrls: string[] = [];
  const { publicBaseUrl, bucket, region } = ossConfig;
  const baseUrl = publicBaseUrl ?? `https://${bucket}.oss-${region}.aliyuncs.com`;

  if (payload.photoFiles?.length) {
    for (let i = 0; i < payload.photoFiles.length; i++) {
      const file = payload.photoFiles[i];
      const ext = getFileExt(file.name);
      const objectName = `${id}/photo_${i + 1}${ext}`;
      await client.put(objectName, file, {
        headers: { 'Content-Type': file.type || 'image/jpeg' },
      });
      photoUrls.push(`${baseUrl}/${objectName}`);
    }
  }

  const jsonPayload: MemorialData = {
    name: payload.name,
    gender: payload.gender,
    birthDate: payload.birthDate,
    deathDate: payload.deathDate,
    biography: payload.biography,
    photoUrls,
  };
  const jsonName = `${id}.json`;
  await client.put(jsonName, new Blob([JSON.stringify(jsonPayload)], { type: 'application/json' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
