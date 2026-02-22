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
  const { name, birthDate, deathDate, biography, photoList = [] } = data;
  const birthStr = birthDate ? dayjs(birthDate).format('YYYY年MM月DD日') : '——';
  const deathStr = deathDate ? dayjs(deathDate).format('YYYY年MM月DD日') : '——';

  return (
    <div className="memorial-card">
      {name && <div className="name">{name}</div>}
      <div className="dates">
        {birthStr} 至 {deathStr}
      </div>
      {biography && (
        <div
          className="bio"
          dangerouslySetInnerHTML={{ __html: biography }}
        />
      )}
      {photoList.length > 0 && (
        <div className="photos">
          {photoList.map((url, i) => (
            <img key={i} src={url} alt="" />
          ))}
        </div>
      )}
    </div>
  );
};
