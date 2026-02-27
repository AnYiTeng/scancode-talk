import React, { useState, useEffect } from 'react';
import { Spin, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import { MemorialCard } from './MemorialCard';
import { MemorialChatModal } from './MemorialChatModal';
import type { MemorialData, MemorialCardData } from './types';
import { getDeceased } from './api';

interface MemorialPreviewProps {
  id: string;
}

export const MemorialPreview: React.FC<MemorialPreviewProps> = ({ id }) => {
  const [data, setData] = useState<MemorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const detail = await getDeceased(id);
        if (cancelled) return;

        const birthDate =
          detail.birth_date != null ? new Date(detail.birth_date).getTime() : undefined;
        const deathDate =
          detail.death_date != null ? new Date(detail.death_date).getTime() : undefined;

        const mapped: MemorialData = {
          name: detail.full_name || undefined,
          gender:
            detail.gender === 'male' || detail.gender === 'female' ? detail.gender : undefined,
          birthDate,
          deathDate,
          biography: detail.biography ?? undefined,
          photoUrls: Array.isArray(detail.photos) ? detail.photos : [],
        };

        setData(mapped);
        setError(null);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '未找到该纪念页数据');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      </div>
    );
  }

  const cardData: MemorialCardData = {
    name: data.name,
    gender: data.gender,
    birthDate: data.birthDate,
    deathDate: data.deathDate,
    biography: data.biography,
    photoList: data.photoUrls ?? [],
  };

  const birthStr = data.birthDate ? dayjs(data.birthDate).format('YYYY年MM月DD日') : '——';
  const deathStr = data.deathDate ? dayjs(data.deathDate).format('YYYY年MM月DD日') : '——';
  const photoList = cardData.photoList ?? [];
  const mediaList = photoList.map((url) => ({
    url,
    isVideo: /\.(mp4|webm|ogg|mov|m4v)$/i.test(url),
  }));
  const hasMedia = mediaList.length > 0;
  const currentMedia = hasMedia ? mediaList[Math.min(activeMediaIndex, mediaList.length - 1)] : null;
  const bioTextSnippet = data.biography
    ? data.biography.replace(/<[^>]+>/g, '').slice(0, 60)
    : null;

  const displayTitle = data.name ? `纪念 · ${data.name}` : '纪念页';
  const genderPronoun = data.gender === 'male' ? '他' : data.gender === 'female' ? '她' : 'TA';

  const tabItems: TabsProps['items'] = [
    {
      key: 'home',
      label: '光影纪念',
      children: (
        <div className="memorial-preview-page__tab-content">
          {hasMedia ? (
            <div className="memorial-preview-page__hero">
              <div className="memorial-preview-page__hero-main">
                {currentMedia?.isVideo ? (
                  <video
                    src={currentMedia.url}
                    controls
                    className="memorial-preview-page__hero-media"
                  />
                ) : (
                  <img
                    src={currentMedia?.url ?? ''}
                    alt={data.name ?? '纪念照片'}
                    className="memorial-preview-page__hero-media"
                  />
                )}
              </div>
              <div className="memorial-preview-page__hero-info">
                {data.name && (
                  <div className="memorial-preview-page__hero-name">{data.name}</div>
                )}
                <div className="memorial-preview-page__hero-dates">
                  {birthStr}　—　{deathStr}
                </div>
                <div className="memorial-preview-page__hero-quote">
                  {bioTextSnippet
                    ? `${bioTextSnippet}${data.biography && data.biography.length > 60 ? '…' : ''}`
                    : '在这里，安放思念与回忆。'}
                </div>
              </div>
            </div>
          ) : (
            <div className="memorial-preview-page__empty">
              暂未上传照片，纪念页仍然可以正常使用。
            </div>
          )}
          {hasMedia && mediaList.length > 1 && (
            <div className="memorial-preview-page__hero-thumbs">
              {mediaList.map((item, index) => (
                <button
                  type="button"
                  key={item.url + index}
                  className={
                    'memorial-preview-page__hero-thumb' +
                    (index === activeMediaIndex
                      ? ' memorial-preview-page__hero-thumb--active'
                      : '')
                  }
                  onClick={() => setActiveMediaIndex(index)}
                >
                  {item.isVideo && (
                    <span className="memorial-preview-page__hero-thumb-badge">视频</span>
                  )}
                  {item.isVideo ? (
                    <video src={item.url} muted />
                  ) : (
                    <img src={item.url} alt="" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'story',
      label: '生平长卷',
      children: (
        <div className="memorial-preview-page__tab-content memorial-preview-page__tab-content--story">
          {data.biography ? (
            <div
              className="memorial-preview-page__story"
              dangerouslySetInnerHTML={{ __html: data.biography }}
            />
          ) : (
            <div className="memorial-preview-page__empty">
              尚未填写生平介绍，可在编辑页补充{genderPronoun}的一生故事。
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'chat',
      label: '心语空间',
      children: (
        <div className="memorial-preview-page__tab-content">
          <MemorialChatModal memorialData={data} />
        </div>
      ),
    },
  ];

  return (
    <div className="memorial-preview-page">
      <header className="memorial-preview-page__header">
        <div className="memorial-preview-page__badge">静心缅怀时刻</div>
        <h1 className="memorial-preview-page__title">{displayTitle}</h1>
        <p className="memorial-preview-page__subtitle">
          在这里，安放思念，也轻轻托起你与 {genderPronoun} 的回忆。
        </p>
        <p className="memorial-preview-page__subtitle memorial-preview-page__subtitle--secondary">
          你可以慢慢看、慢慢写，让那些想说却来不及说的话，在此轻声落下。
        </p>
      </header>
      <div className="scan-hint">愿这些文字与影像，陪你一起度过想念 {genderPronoun} 的时刻。</div>
      <div className="memorial-preview-page__tabs">
        <Tabs items={tabItems} />
      </div>
    </div>
  );
};
