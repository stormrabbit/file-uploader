import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { StorageEngine } from 'multer';
import { Request } from 'express';
import * as nuid from 'nuid';

export interface HashedFileInfo {
  path: string;
  size: number;
  md5: string;
}

export class HashingDiskStorage implements StorageEngine {
  constructor(private readonly getTmpDir: () => string) {}

  _handleFile(
    _req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<HashedFileInfo>) => void,
  ): void {
    const tmpDir = this.getTmpDir();
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tmpName = `${nuid.next()}-${path.basename(file.originalname)}`;
    const tmpPath = path.join(tmpDir, tmpName);

    const hash = crypto.createHash('md5');
    const ws = fs.createWriteStream(tmpPath);

    let size = 0;
    let settled = false;

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      file.stream.unpipe(ws);
      ws.destroy();
      fs.unlink(tmpPath, () => cb(err));
    };

    const done = () => {
      if (settled) return;
      settled = true;
      cb(null, { path: tmpPath, size, md5: hash.digest('hex') });
    };

    file.stream.on('data', (chunk: Buffer) => {
      hash.update(chunk);
      size += chunk.length;
    });

    file.stream.on('error', fail);
    ws.on('error', fail);
    ws.on('finish', done);

    file.stream.pipe(ws);
  }

  _removeFile(
    _req: Request,
    file: Express.Multer.File & { path: string },
    cb: (error: Error | null) => void,
  ): void {
    fs.unlink(file.path, cb);
  }
}
