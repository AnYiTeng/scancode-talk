import React, { useState, useEffect } from 'react';
import { Spin, ConfigProvider } from 'antd';
import { useHashRoute } from './hooks/useHashRoute';
import { MemorialEditor } from './MemorialEditor';
import { MemorialPreview } from './MemorialPreview';
import './Memorial.scss';

export const MemorialGenerator: React.FC = () => {
  const [path, setHash, getQueryId] = useHashRoute();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const handleGenerate = (id: string) => {
    setHash('/preview', 'id=' + encodeURIComponent(id));
  };

  useEffect(() => {
    if (!ready) return;
    // 根路径统一到表单页路由
    if (path.path === '/' || path.path === '') {
      setHash('/create');
    }
  }, [ready, path.path, setHash]);

  if (!ready) {
    return (
      <div className="memorial-page">
        <div className="memorial-loading">
          <Spin size="large" />
          <span>加载中…</span>
        </div>
      </div>
    );
  }

  // 预览页：/preview?id=xxx
  if (path.path === '/preview') {
    const id = getQueryId();
    if (id) {
      return (
        <div className="memorial-page memorial-page--preview">
          <MemorialPreview id={id} />
        </div>
      );
    }
  }

  // 表单页：/create（根路径 / 会重定向到 /create）
  if (path.path === '/create' || path.path === '/' || path.path === '') {
    return (
      <div className="memorial-page">
        <MemorialEditor onGenerate={handleGenerate} />
      </div>
    );
  }

  return null;
};

/** 带 ConfigProvider 的纪念页生成器入口，可直接挂到根 */
export const MemorialGeneratorPage: React.FC = () => (
  <ConfigProvider
    theme={{
      token: {
        fontFamily: "var(--font-serif), 'Noto Serif SC', 'Source Han Serif SC', SimSun, serif",
      },
    }}
  >
    <MemorialGenerator />
  </ConfigProvider>
);
