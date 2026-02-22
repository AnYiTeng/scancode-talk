import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// 模块级计数，Strict Mode 二次挂载时得到新 key，从而使用全新 DOM 节点，避免双工具栏
let editorInstanceId = 0;

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
}) => {
  const [containerKey] = useState(() => ++editorInstanceId);
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const quill = new Quill(container, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: [
            ['bold'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
          handlers: {
            image: function (this: { quill: Quill }) {
              const q = this.quill;
              if (!q) return;
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');
              input.onchange = () => {
                const file = input.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                  const url = e.target?.result;
                  if (url && typeof url === 'string') {
                    const range = q.getSelection(true);
                    q.insertEmbed(range.index, 'image', url, 'user');
                    q.setSelection(range.index + 1);
                  }
                };
                reader.readAsDataURL(file);
              };
              input.click();
            },
          },
        },
      },
    });

    if (value) {
      quill.root.innerHTML = value;
    }
    quill.on('text-change', () => {
      onChange(quill.root.innerHTML);
    });

    quillRef.current = quill;

    return () => {
      quillRef.current = null;
      container.innerHTML = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 受控：外部 value 变化时同步到编辑器（避免与内部 text-change 冲突）
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || value === undefined) return;
    const current = quill.root.innerHTML;
    if (current !== value) {
      quill.root.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="memorial-rich-text-editor" style={{ background: '#fff', borderRadius: 8 }}>
      <div key={containerKey} ref={containerRef} />
    </div>
  );
};
