import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import type { GatewayConfig } from '../shared/types';
import { DEFAULT_FUTU_CONFIG, DEFAULT_TIGER_CONFIG } from '../shared/types';

const CONFIG_FILE = path.join(app.getPath('userData'), 'gateway-config.json');

export function loadConfig(): GatewayConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.provider === 'tiger') {
        return { ...DEFAULT_TIGER_CONFIG, ...parsed };
      }
      return { ...DEFAULT_FUTU_CONFIG, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_FUTU_CONFIG };
}

export function saveConfig(config: GatewayConfig): void {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}
