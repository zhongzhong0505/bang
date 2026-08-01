import React from 'react';
import { ConfigProvider, DatePicker as AntDatePicker, theme as antdTheme } from 'antd';
import dayjs from 'dayjs';
import { useStore } from '../store';

interface AppDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const AppDatePicker: React.FC<AppDatePickerProps> = ({ value, onChange, placeholder }) => {
  const resolvedTheme = useStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <AntDatePicker
        value={value ? dayjs(value) : null}
        onChange={(_, dateStr) => onChange(dateStr as string)}
        placeholder={placeholder}
        format="YYYY-MM-DD"
        getPopupContainer={(trigger) => trigger.parentElement || document.body}
        style={{ width: 150 }}
      />
    </ConfigProvider>
  );
};

export default AppDatePicker;
