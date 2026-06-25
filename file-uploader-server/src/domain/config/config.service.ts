import { Injectable } from '@nestjs/common';
import { getStorageDir, setStorageDir } from 'src/config/runtime-paths';

@Injectable()
export class ConfigService {
  getConfig() {
    return { storageDir: getStorageDir() };
  }

  updateStorageDir(dir: string) {
    setStorageDir(dir);
    return { storageDir: getStorageDir() };
  }
}
