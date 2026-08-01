import React from 'react';
import { ConfigProvider, Modal, theme as antdTheme } from 'antd';
import { useStore } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: React.ReactNode;
}

const AppModal: React.FC<Props> = ({ open, onClose, title, width = 800, children }) => {
  const resolvedTheme = useStore((s) => s.resolvedTheme);

  return (
    <ConfigProvider theme={{
      algorithm: resolvedTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    }}>
      <Modal open={open} onCancel={onClose} footer={null} width={width} title={title}>
        {children}
      </Modal>
    </ConfigProvider>
  );
};

export default AppModal;
