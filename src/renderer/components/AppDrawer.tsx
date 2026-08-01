import React from 'react';
import { ConfigProvider, Drawer, theme as antdTheme } from 'antd';
import { useStore } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: React.ReactNode;
}

const AppDrawer: React.FC<Props> = ({ open, onClose, title, width = 360, children }) => {
  const resolvedTheme = useStore((s) => s.resolvedTheme);

  return (
    <ConfigProvider theme={{
      algorithm: resolvedTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    }}>
      <Drawer open={open} onClose={onClose} width={width} title={title}>
        {children}
      </Drawer>
    </ConfigProvider>
  );
};

export default AppDrawer;
