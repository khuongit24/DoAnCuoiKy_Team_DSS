import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Spin, Typography } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { genaiService } from '../../services/genaiService';
import styles from './GenAIChatBox.module.css';

const { Text } = Typography;

export const GenAIChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'ai', content: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?' }]);
    }
    scrollToBottom();
  }, [isOpen, messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await genaiService.chat(userMessage);
      if (response && response.success) {
         setMessages((prev) => [...prev, { role: 'ai', content: response.data.reply }]);
      } else {
         setMessages((prev) => [...prev, { role: 'ai', content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.' }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Không thể kết nối đến server AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.chatContainer}>
      {!isOpen ? (
        <Button
          type="primary"
          shape="circle"
          icon={<MessageOutlined />}
          size="large"
          className={styles.floatingButton}
          onClick={() => setIsOpen(true)}
          aria-label="Mở khung chat AI"
        />
      ) : (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.headerTitle}>
              <RobotOutlined />
              <Text strong style={{ color: 'white' }}>AI Assistant</Text>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined style={{ color: 'white' }} />}
              onClick={() => setIsOpen(false)}
              aria-label="Đóng khung chat AI"
            />
          </div>

          <div className={styles.chatBody}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.messageUser : styles.messageAI}`}>
                {msg.role === 'ai' && <RobotOutlined className={styles.avatar} />}
                <div className={`${styles.messageBubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI}`}>
                  {msg.role === 'ai' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === 'user' && <UserOutlined className={styles.avatar} />}
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.messageWrapper} ${styles.messageAI}`}>
                <RobotOutlined className={styles.avatar} />
                <div className={`${styles.messageBubble} ${styles.bubbleAI}`}>
                  <Spin size="small" /> <Text type="secondary">AI đang nghĩ...</Text>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.chatFooter}>
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={isLoading}
              className={styles.inputArea}
              aria-label="Nhập tin nhắn cho AI"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={isLoading}
              disabled={!input.trim()}
              aria-label="Gửi tin nhắn"
            />
          </div>
        </div>
      )}
    </div>
  );
};
