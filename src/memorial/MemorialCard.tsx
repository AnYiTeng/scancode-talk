import React from 'react';
import dayjs from 'dayjs';
import type { MemorialCardData } from './types';

interface MemorialCardProps {
  data: MemorialCardData | null;
}

export const MemorialCard: React.FC<MemorialCardProps> = ({ data }) => {
  if (!data) {
    return <div style={{ color: '#999' }}>填写左侧表单即可预览</div>;
  }
  const { name, gender, birthDate, deathDate, biography, photoList = [] } = data;
  const birthStr = birthDate ? dayjs(birthDate).format('YYYY年MM月DD日') : '——';
  const deathStr = deathDate ? dayjs(deathDate).format('YYYY年MM月DD日') : '——';

  const mediaList = photoList.map((url) => ({
    url,
    isVideo: /\.(mp4|webm|ogg|mov|m4v)$/i.test(url),
  }));

  return (
    <div className="memorial-card">
      {name && <div className="name">{name}</div>}
      {gender && (
        <div className="gender">性别：{gender === 'male' ? '男' : '女'}</div>
      )}
      <div className="dates">
        {birthStr} 至 {deathStr}
      </div>
      {biography && (
        <div
          className="bio"
          dangerouslySetInnerHTML={{ __html: biography }}
        />
      )}
      {mediaList.length > 0 && (
        <div className="photos">
          {mediaList.map((item, i) =>
            item.isVideo ? (
              <video key={i} src={item.url} controls />
            ) : (
              <img key={i} src={item.url} alt="" />
            ),
          )}
        </div>
      )}
    </div>
  );
};
