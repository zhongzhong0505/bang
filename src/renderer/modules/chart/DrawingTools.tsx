import React, { useState, useCallback } from 'react';
import type { IChartApi } from 'lightweight-charts';
import type { KlineData, Drawing } from '../../../shared/types';

interface Props {
  chart: IChartApi;
  data: KlineData[];
  mode: string | null;
  onModeChange: (m: string | null) => void;
  drawings: Drawing[];
  onDrawingsChange: (d: Drawing[]) => void;
}

const TOOLS = [
  { id: 'trend_line', icon: '╱', title: '趋势线' },
  { id: 'horizontal_line', icon: '─', title: '水平线' },
  { id: 'ray', icon: '➜', title: '射线' },
  { id: 'fibonacci', icon: 'F', title: '斐波那契回撤' },
  { id: 'rectangle', icon: '▭', title: '矩形' },
  { id: 'text', icon: 'T', title: '文字标注' },
  { id: 'measure', icon: '📏', title: '测量工具' },
  { id: 'clear', icon: '✕', title: '清除全部' },
];

const DrawingTools: React.FC<Props> = ({ chart, data, mode, onModeChange, drawings, onDrawingsChange }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [drawStep, setDrawStep] = useState(0); // for multi-point tools
  const [tempPoints, setTempPoints] = useState<{ time: number; price: number }[]>([]);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const handleSelect = (toolId: string) => {
    if (toolId === 'clear') {
      onDrawingsChange([]);
      setActiveTool(null);
      onModeChange(null);
      return;
    }
    const next = activeTool === toolId ? null : toolId;
    setActiveTool(next);
    onModeChange(next);
    setDrawStep(0);
    setTempPoints([]);
  };

  // For text tool, show input dialog
  const handleTextConfirm = () => {
    if (tempPoints.length > 0 && textInput.trim()) {
      const drawing: Drawing = {
        id: `draw-${Date.now()}`,
        type: 'text',
        points: tempPoints,
        color: '#d1d4dc',
        text: textInput.trim(),
      };
      onDrawingsChange([...drawings, drawing]);
    }
    setTextInput('');
    setShowTextInput(false);
    setTempPoints([]);
    setDrawStep(0);
    setActiveTool(null);
    onModeChange(null);
  };

  // Calculate fibonacci levels from two points
  const getFibLevels = (p1: { price: number }, p2: { price: number }) => {
    const diff = p2.price - p1.price;
    return [
      { level: '0.0', price: p1.price },
      { level: '0.236', price: p1.price + diff * 0.236 },
      { level: '0.382', price: p1.price + diff * 0.382 },
      { level: '0.5', price: p1.price + diff * 0.5 },
      { level: '0.618', price: p1.price + diff * 0.618 },
      { level: '0.786', price: p1.price + diff * 0.786 },
      { level: '1.0', price: p2.price },
    ];
  };

  return (
    <div className="draw-toolbar">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          className={`draw-btn${activeTool === tool.id ? ' draw-btn-active' : ''}`}
          onClick={() => handleSelect(tool.id)}
          title={tool.title}
        >
          {tool.icon}
        </button>
      ))}
      {activeTool && (
        <span className="draw-hint">
          {activeTool === 'trend_line' && (drawStep === 0 ? '点击起点' : '点击终点')}
          {activeTool === 'horizontal_line' && '点击价格位置'}
          {activeTool === 'ray' && (drawStep === 0 ? '点击起点' : '点击方向')}
          {activeTool === 'fibonacci' && (drawStep === 0 ? '点击起点' : '点击终点')}
          {activeTool === 'rectangle' && (drawStep === 0 ? '点击左上角' : '点击右下角')}
          {activeTool === 'text' && '点击标注位置'}
          {activeTool === 'measure' && (drawStep === 0 ? '点击起点' : '点击终点')}
        </span>
      )}
      {showTextInput && (
        <div className="draw-text-input">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTextConfirm(); }}
            placeholder="输入标注文字"
            autoFocus
          />
          <button onClick={handleTextConfirm}>确定</button>
        </div>
      )}
    </div>
  );
};

export default DrawingTools;
