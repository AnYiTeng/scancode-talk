import React, { useState } from 'react';
import { Form, Input, Button, Upload, message, Radio } from 'antd';
import { DatePicker as MobileDatePicker } from 'antd-mobile';
import type { UploadFile } from 'antd';
import { MemorialCard } from './MemorialCard';
import { RichTextEditor } from './RichTextEditor';
import { ossConfig } from './ossConfig';
import { uploadMemorial } from './ossUpload';
import { createDeceased } from './api';
import type { MemorialCardData } from './types';

interface MemorialEditorProps {
  onGenerate: (id: string) => void;
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

function formatDateForDisplay(v: unknown): string {
  const ts = toTimestamp(v);
  if (!ts) return '';
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const MemorialEditor: React.FC<MemorialEditorProps> = ({ onGenerate }) => {
  const [form] = Form.useForm();
  const [bioHtml, setBioHtml] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [birthPickerVisible, setBirthPickerVisible] = useState(false);
  const [deathPickerVisible, setDeathPickerVisible] = useState(false);

  const values = Form.useWatch([], form) ?? {};
  const previewData: MemorialCardData = {
    name: values.name,
    gender: values.gender,
    birthDate: values.birthDate?.valueOf?.() ?? values.birthDate,
    deathDate: values.deathDate?.valueOf?.() ?? values.deathDate,
    biography: bioHtml,
    // 预览区仅展示图片，避免视频在卡片中以图片方式渲染异常
    photoList: fileList
      .filter((f) => {
        const file = f.originFileObj as File | undefined;
        return !file || file.type.startsWith('image/');
      })
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
      message.warning('请先配置 OSS（.env.local 中的 REACT_APP_OSS_*）');
      return;
    }
    setSubmitting(true);
    try {
      const id = 'memorial_' + Date.now();
      const formValues = form.getFieldsValue();
      const photoFiles: File[] = [];
      for (const f of fileList) {
        const file = f.originFileObj ?? (f as unknown as File);
        if (file && file instanceof File) photoFiles.push(file);
      }
      const photoUrls = await uploadMemorial(id, {
        name: formValues.name,
        gender: formValues.gender,
        birthDate: toTimestamp(formValues.birthDate),
        deathDate: toTimestamp(formValues.deathDate),
        biography: bioHtml ?? '',
        photoFiles,
      });
      const birthDateStr: string | undefined =
        (formValues.birthDate && formValues.birthDate.format?.('YYYY-MM-DD')) ||
        (toTimestamp(formValues.birthDate)
          ? new Date(toTimestamp(formValues.birthDate)!).toISOString().slice(0, 10)
          : undefined);
      const deathDateStr: string | undefined =
        (formValues.deathDate && formValues.deathDate.format?.('YYYY-MM-DD')) ||
        (toTimestamp(formValues.deathDate)
          ? new Date(toTimestamp(formValues.deathDate)!).toISOString().slice(0, 10)
          : undefined);

      const created = await createDeceased({
        full_name: formValues.name,
        gender: formValues.gender,
        birth_date: birthDateStr,
        death_date: deathDateStr,
        biography: bioHtml ?? '',
        photos: photoUrls,
      });
      message.success('纪念页已生成');
      // 预览逻辑改为使用后端返回的 qr_code_id
      onGenerate(created.qr_code_id);
    } catch (e) {
      console.error('OSS 上传失败', e);
      message.error(e instanceof Error ? e.message : '上传失败，请检查 OSS 配置与网络');
    } finally {
      setSubmitting(false);
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
          <Form.Item name="gender" label="性别">
            <Radio.Group>
              <Radio value="male">男</Radio>
              <Radio value="female">女</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="birthDate" label="出生日期">
            <>
              <Button block onClick={() => setBirthPickerVisible(true)}>
                {formatDateForDisplay(values.birthDate) || '选择出生日期'}
              </Button>
              <MobileDatePicker
                precision="day"
                visible={birthPickerVisible}
                onClose={() => setBirthPickerVisible(false)}
                value={values.birthDate}
                onConfirm={(val: Date) => {
                  setBirthPickerVisible(false);
                  form.setFieldsValue({ birthDate: val });
                }}
              />
            </>
          </Form.Item>
          <Form.Item name="deathDate" label="逝世日期">
            <>
              <Button block onClick={() => setDeathPickerVisible(true)}>
                {formatDateForDisplay(values.deathDate) || '选择逝世日期'}
              </Button>
              <MobileDatePicker
                precision="day"
                visible={deathPickerVisible}
                onClose={() => setDeathPickerVisible(false)}
                value={values.deathDate}
                onConfirm={(val: Date) => {
                  setDeathPickerVisible(false);
                  form.setFieldsValue({ deathDate: val });
                }}
              />
            </>
          </Form.Item>
          <Form.Item label="生平介绍">
            <RichTextEditor value={bioHtml} onChange={setBioHtml} />
          </Form.Item>
          <Form.Item
            name="photos"
            label="照片 / 视频（使用下方按钮调整顺序）"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              beforeUpload={() => false}
              accept="image/*,video/*"
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
        </div>
      </div>
      <div className="memorial-editor__preview preview-panel">
        <div className="preview-title">实时预览</div>
        <MemorialCard data={previewData} />
      </div>
    </div>
  );
};
