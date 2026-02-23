import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, Button, message as antMessage } from 'antd';
import { buildSystemPrompt, sendChatStream, type ChatMessage } from './bailianChat';
import type { MemorialData } from './types';
import './MemorialChatModal.scss';

const { TextArea } = Input;

const MAX_HISTORY = 10;

interface MemorialChatModalProps {
  visible: boolean;
  onClose: () => void;
  memorialData: MemorialData;
}

export const MemorialChatModal: React.FC<MemorialChatModalProps> = ({
  visible,
  onClose,
  memorialData,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const systemPrompt = buildSystemPrompt(memorialData);

  useEffect(() => {
    if (visible) {
      setMessages([]);
      setStreamingContent('');
      setInput('');
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      return next.slice(-MAX_HISTORY * 2);
    });
    setLoading(true);
    setStreamingContent('');
    setError(null);

    try {
      const history = [...messages, userMsg].slice(0, -1);
      const reply = await sendChatStream(
        systemPrompt,
        history,
        text,
        (delta) => setStreamingContent((prev) => prev + delta)
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '网络或服务异常，请稍后再试';
      setError(errMsg);
      antMessage.error(errMsg);
    } finally {
      setLoading(false);
      setStreamingContent('');
    }
  };

  return (
    <Modal
      title={`与${memorialData.name ?? 'TA'}对话`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnClose
      className="memorial-chat-modal"
      afterOpenChange={(open) => {
        if (!open) setError(null);
      }}
    >
      <div className="memorial-chat-modal__body">
        <div className="memorial-chat-modal__messages" ref={listRef}>
          {messages.length === 0 && (
            <div className="memorial-chat-modal__placeholder">
              在这里向 TA 说说心里话，TA 会以第一人称温和地回应你。
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`memorial-chat-modal__msg memorial-chat-modal__msg--${m.role}`}
            >
              <span className="memorial-chat-modal__msg-role">
                {m.role === 'user' ? '我' : memorialData.name ?? 'TA'}
              </span>
              <div className="memorial-chat-modal__msg-content">{m.content}</div>
            </div>
          ))}
          {(loading || streamingContent) && (
            <div className="memorial-chat-modal__msg memorial-chat-modal__msg--assistant">
              <span className="memorial-chat-modal__msg-role">
                {memorialData.name ?? 'TA'}
              </span>
              <div className="memorial-chat-modal__msg-content memorial-chat-modal__msg-content--streaming">
                {streamingContent || '正在回复…'}
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="memorial-chat-modal__error">{error}</div>
        )}
        <div className="memorial-chat-modal__input-row">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入想对 TA 说的话…"
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled={loading}
            className="memorial-chat-modal__input"
          />
          <Button
            type="primary"
            onClick={handleSend}
            loading={loading}
            disabled={!input.trim()}
            className="memorial-chat-modal__send"
          >
            发送
          </Button>
        </div>
      </div>
    </Modal>
  );
};
