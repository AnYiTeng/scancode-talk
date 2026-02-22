import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Spin } from 'antd';
import { QRCodeCanvas } from 'qrcode.react';
import { MemorialCard } from './MemorialCard';
import { ossConfig } from './ossConfig';
import { SIMULATE_PREFIX, QR_SIZE, QR_DOWNLOAD_SIZE } from './constants';
import type { MemorialData, MemorialCardData } from './types';

interface MemorialPreviewProps {
  id: string;
}

export const MemorialPreview: React.FC<MemorialPreviewProps> = ({ id }) => {
  const [data, setData] = useState<MemorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const previewUrl =
    window.location.origin +
    window.location.pathname +
    '#/preview?id=' +
    encodeURIComponent(id);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const raw = window.localStorage.getItem(SIMULATE_PREFIX + id);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as MemorialData;
          if (!cancelled) setData(parsed);
        } catch {
          if (!cancelled) setError('数据解析失败');
        }
        if (!cancelled) setLoading(false);
        return;
      }
      const baseUrl = ossConfig.publicBaseUrl;
      if (baseUrl) {
        try {
          const url = `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(id)}.json`;
          const res = await fetch(url);
          if (res.ok) {
            const parsed = (await res.json()) as MemorialData;
            if (!cancelled) setData(parsed);
          } else if (!cancelled) {
            setError('未找到该纪念页数据');
          }
        } catch {
          if (!cancelled) setError('未找到该纪念页数据');
        }
      } else {
        if (!cancelled) setError('未找到该纪念页数据');
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSaveQr = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'memorial-qrcode.png';
    const newCanvas = document.createElement('canvas');
    newCanvas.width = QR_DOWNLOAD_SIZE;
    newCanvas.height = QR_DOWNLOAD_SIZE;
    const ctx = newCanvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, QR_DOWNLOAD_SIZE, QR_DOWNLOAD_SIZE);
    ctx.drawImage(canvas, 0, 0, QR_SIZE, QR_SIZE, 0, 0, QR_DOWNLOAD_SIZE, QR_DOWNLOAD_SIZE);
    link.href = newCanvas.toDataURL('image/png');
    link.click();
  }, []);

  if (loading) {
    return (
      <div className="memorial-loading">
        <Spin size="large" />
        <span>加载纪念页…</span>
      </div>
    );
  }

  if (error ?? !data) {
    return (
      <div className="memorial-loading">
        <p>{error ?? '未找到数据'}</p>
        <Button type="primary" onClick={() => { window.location.hash = '/'; }}>
          返回编辑
        </Button>
      </div>
    );
  }

  const cardData: MemorialCardData = {
    name: data.name,
    birthDate: data.birthDate,
    deathDate: data.deathDate,
    biography: data.biography,
    photoList: data.photoUrls ?? [],
  };

  return (
    <div className="memorial-preview-page">
      <div className="memorial-preview-page__back">
        <Button type="link" onClick={() => { window.location.hash = '/'; }}>
          ← 返回编辑
        </Button>
      </div>
      <div className="scan-hint">扫码访问</div>
      <div className="qr-area" ref={qrRef}>
        <QRCodeCanvas
          value={previewUrl}
          size={QR_SIZE}
          level="H"
          bgColor="#ffffff"
          fgColor="#000000"
        />
        <Button className="save-qr-btn" onClick={handleSaveQr}>
          保存二维码
        </Button>
      </div>
      <MemorialCard data={cardData} />
    </div>
  );
};
