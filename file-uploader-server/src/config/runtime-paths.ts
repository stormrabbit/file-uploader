import * as path from 'path';
import * as fs from 'fs';

let _dataDir: string | null = null;
let _storageDir: string | null = null;

function resolveDataDir(): string {
  const env = process.env.DATA_DIR;
  return env && env.trim() ? path.resolve(env.trim()) : process.cwd();
}

export function getDataDir(): string {
  if (_dataDir === null) {
    _dataDir = resolveDataDir();
  }
  return _dataDir;
}

function resolveStorageDir(): string {
  const env = process.env.STORAGE_DIR;
  if (env && env.trim()) {
    return path.resolve(env.trim());
  }
  // 读取持久化配置
  const configPath = path.join(getDataDir(), 'config.json');
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.storageDir && typeof config.storageDir === 'string') {
      return config.storageDir;
    }
  } catch {
    // config.json 不存在或格式异常，使用默认值
  }
  return path.join(getDataDir(), 'static');
}

export function getStorageDir(): string {
  if (_storageDir === null) {
    _storageDir = resolveStorageDir();
  }
  return _storageDir;
}

export function setStorageDir(dir: string): void {
  _storageDir = path.resolve(dir);
  const configPath = path.join(getDataDir(), 'config.json');
  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    // ignore
  }
  config.storageDir = _storageDir;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function __resetForTest(): void {
  if (process.env.NODE_ENV === 'test') {
    _dataDir = null;
    _storageDir = null;
  }
}
