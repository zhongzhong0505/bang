import React from 'react';
import './chart.css';
import { useStore } from '../../store';
import type { KlineData } from '../../../shared/types';

interface Props {
  data: KlineData[];
}

const ReplayControls: React.FC<Props> = ({ data }) => {
  const replayIndex = useStore((s) => s.replayIndex);
  const setReplayIndex = useStore((s) => s.setReplayIndex);
  const toggleReplayMode = useStore((s) => s.toggleReplayMode);

  const currentBar = data[replayIndex - 1] || data[0];
  const progress = data.length > 0 ? ((replayIndex / data.length) * 100).toFixed(1) : '0';

  const stepForward = () => {
    if (replayIndex < data.length) {
      setReplayIndex(replayIndex + 1);
    }
  };

  const stepBackward = () => {
    if (replayIndex > 60) {
      setReplayIndex(replayIndex - 1);
    }
  };

  const jumpToStart = () => setReplayIndex(60);
  const jumpToEnd = () => setReplayIndex(data.length);

  const timeStr = currentBar
    ? new Date(currentBar.time * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="replay-controls">
      <button className="replay-btn" onClick={jumpToStart} title="跳到开始">⏮</button>
      <button className="replay-btn" onClick={stepBackward} title="后退">◀</button>
      <button className="replay-btn" onClick={stepForward} title="前进">▶</button>
      <button className="replay-btn" onClick={jumpToEnd} title="跳到结束">⏭</button>
      <span className="replay-info">
        {replayIndex}/{data.length} · {progress}% · {timeStr}
      </span>
      <input
        type="range"
        min={60}
        max={data.length}
        value={replayIndex}
        onChange={(e) => setReplayIndex(+e.target.value)}
        style={{ width: 120 }}
        className="replay-slider"
      />
      <button className="replay-btn" onClick={toggleReplayMode} title="退出回放">✕</button>
    </div>
  );
};

export default ReplayControls;
