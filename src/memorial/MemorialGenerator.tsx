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

  return (
    <div className="memorial-page">
      <MemorialEditor onGenerate={handleGenerate} />
    </div>
  );
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
