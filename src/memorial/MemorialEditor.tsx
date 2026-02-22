import React, { useState } from 'react';
import { Form, Input, DatePicker, Button, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import { MemorialCard } from './MemorialCard';
import { RichTextEditor } from './RichTextEditor';
import { readFileAsDataURL } from './utils';
import { ossConfig } from './ossConfig';
import { SIMULATE_PREFIX } from './constants';
import type { MemorialCardData } from './types';

interface MemorialEditorProps {
  onGenerate: (id: string) => void;
  onSimulate: (id: string) => void;
}

function normFile(e: { fileList?: UploadFile[] }) {
  if (Array.isArray(e)) return e;
  return e?.fileList ?? [];
}

function toTimestamp(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'object' && typeof (v as { valueOf?: () => number }).valueOf === 'function') {
    const n = (v as { valueOf: () => number }).valueOf();
    return typeof n === 'number' && !Number.isNaN(n) ? n : undefined;
  }
  return undefined;
}

export const MemorialEditor: React.FC<MemorialEditorProps> = ({
  onGenerate,
  onSimulate,
}) => {
  const [form] = Form.useForm();
  const [bioHtml, setBioHtml] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const values = Form.useWatch([], form) ?? {};
  const previewData: MemorialCardData = {
    name: values.name,
    birthDate: values.birthDate?.valueOf?.() ?? values.birthDate,
    deathDate: values.deathDate?.valueOf?.() ?? values.deathDate,
    biography: bioHtml,
    photoList: fileList
      .map((f) => f.thumbUrl ?? f.url ?? (f.originFileObj && URL.createObjectURL(f.originFileObj)))
      .filter(Boolean) as string[],
  };

  const handleGenerate = async () => {
    try {
      await form.validateFields(['name']);
    } catch {
      return;
    }
    if (!ossConfig.isConfigured) {
      message.warning('尚未配置 OSS，请使用「模拟生成」进行测试');
      return;
    }
    setSubmitting(true);
    try {
      // const id = 'memorial_' + Date.now(); // OSS 实现时用于 JSON/照片路径
      message.info('OSS 未实现上传逻辑，请配置并实现上传后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulate = async () => {
    try {
      await form.validateFields(['name']);
    } catch {
      return;
    }
    setSimulating(true);
    try {
      const id = 'memorial_' + Date.now();
      const formValues = form.getFieldsValue();
      const photoUrls: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const file = f.originFileObj ?? (f as unknown as File);
        if (file && file instanceof File) {
          const dataUrl = await readFileAsDataURL(file);
          photoUrls.push(dataUrl);
        } else if (f.thumbUrl ?? f.url) {
          photoUrls.push((f.thumbUrl ?? f.url) as string);
        }
      }
      const payload = {
        name: formValues.name,
        birthDate: toTimestamp(formValues.birthDate),
        deathDate: toTimestamp(formValues.deathDate),
        biography: bioHtml ?? '',
        photoUrls,
      };
      const json = JSON.stringify(payload);
      const KEY = SIMULATE_PREFIX + id;
      try {
        window.localStorage.setItem(KEY, json);
      } catch (storageErr) {
        if (storageErr instanceof Error && storageErr.name === 'QuotaExceededError') {
          message.error('数据过大（照片过多或过大），请减少照片后重试');
        } else {
          throw storageErr;
        }
        return;
      }
      onSimulate(id);
    } catch (e) {
      console.error('模拟生成失败', e);
      message.error('模拟生成失败，请检查填写内容或稍后重试');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="memorial-editor">
      <div className="memorial-editor__form form-panel">
        <h1 className="memorial-editor__title">数字纪念页生成工具</h1>
        <div className="form-title">填写纪念信息</div>
        <Form form={form} layout="vertical" initialValues={{}}>
          <Form.Item
            name="name"
            label="逝者姓名"
            rules={[{ required: true, message: '请填写姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="birthDate" label="出生日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择出生日期" />
          </Form.Item>
          <Form.Item name="deathDate" label="逝世日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择逝世日期" />
          </Form.Item>
          <Form.Item label="生平介绍">
            <RichTextEditor value={bioHtml} onChange={setBioHtml} />
          </Form.Item>
          <Form.Item
            name="photos"
            label="照片（使用下方按钮调整顺序）"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              beforeUpload={() => false}
              accept="image/*"
              multiple
            >
              {fileList.length >= 9 ? null : '+ 上传'}
            </Upload>
          </Form.Item>
          {fileList.length > 1 && (
            <Form.Item label="调整顺序（上移/下移）">
              <div className="memorial-editor__order-list">
                {fileList.map((f, i) => (
                  <div key={i} className="memorial-editor__order-item">
                    <Button
                      size="small"
                      disabled={i === 0}
                      onClick={() => {
                        const next = [...fileList];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        setFileList(next);
                      }}
                    >
                      上移
                    </Button>
                    <Button
                      size="small"
                      disabled={i === fileList.length - 1}
                      onClick={() => {
                        const next = [...fileList];
                        [next[i], next[i + 1]] = [next[i + 1], next[i]];
                        setFileList(next);
                      }}
                    >
                      下移
                    </Button>
                    <span className="memorial-editor__order-label">
                      {i + 1}. {f.name ?? '图片'}
                    </span>
                  </div>
                ))}
              </div>
            </Form.Item>
          )}
        </Form>
        <div className="memorial-editor__actions">
          <Button type="primary" onClick={handleGenerate} loading={submitting}>
            生成纪念页
          </Button>
          <Button onClick={handleSimulate} loading={simulating}>
            模拟生成
          </Button>
        </div>
      </div>
      <div className="memorial-editor__preview preview-panel">
        <div className="preview-title">实时预览</div>
        <MemorialCard data={previewData} />
      </div>
    </div>
  );
};
