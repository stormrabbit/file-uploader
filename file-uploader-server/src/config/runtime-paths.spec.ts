import * as path from 'path';

process.env.NODE_ENV = 'test';

import {
  getDataDir,
  getStaticDir,
  getStorageDir,
  __resetForTest,
} from './runtime-paths';

describe('runtime-paths', () => {
  beforeEach(() => {
    __resetForTest();
    delete process.env.DATA_DIR;
    delete process.env.STORAGE_DIR;
  });

  afterEach(() => {
    __resetForTest();
    delete process.env.DATA_DIR;
    delete process.env.STORAGE_DIR;
  });

  describe('getDataDir()', () => {
    it('DATA_DIR 未设置时返回 process.cwd()', () => {
      expect(getDataDir()).toBe(process.cwd());
    });

    it('DATA_DIR 为绝对路径时直接使用', () => {
      process.env.DATA_DIR = '/tmp/fu-test';
      __resetForTest();
      expect(getDataDir()).toBe('/tmp/fu-test');
    });

    it('DATA_DIR 为相对路径时相对 cwd 解析', () => {
      process.env.DATA_DIR = './tmp/data';
      __resetForTest();
      expect(getDataDir()).toBe(path.resolve('./tmp/data'));
    });

    it('DATA_DIR 包含空格时正确解析', () => {
      process.env.DATA_DIR = '/tmp/fu test/data';
      __resetForTest();
      expect(getDataDir()).toBe('/tmp/fu test/data');
    });

    it('缓存：多次调用返回同一值', () => {
      const first = getDataDir();
      const second = getDataDir();
      expect(first).toBe(second);
    });
  });

  describe('getStorageDir()', () => {
    it('未设置时返回 cwd/static', () => {
      expect(getStorageDir()).toBe(path.join(process.cwd(), 'static'));
    });

    it('STORAGE_DIR 设置后优先使用', () => {
      process.env.STORAGE_DIR = '/tmp/my-storage';
      __resetForTest();
      expect(getStorageDir()).toBe('/tmp/my-storage');
    });

    it('DATA_DIR 设置后返回 DATA_DIR/static', () => {
      process.env.DATA_DIR = '/tmp/fu-test';
      __resetForTest();
      expect(getStorageDir()).toBe('/tmp/fu-test/static');
    });
  });

  describe('getStaticDir()', () => {
    it('DATA_DIR 未设置时返回 cwd/static', () => {
      expect(getStaticDir()).toBe(path.join(process.cwd(), 'static'));
    });

    it('DATA_DIR 设置后返回 DATA_DIR/static', () => {
      process.env.DATA_DIR = '/tmp/fu-test';
      __resetForTest();
      expect(getStaticDir()).toBe('/tmp/fu-test/static');
    });
  });
});
