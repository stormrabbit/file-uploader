import * as crypto from 'crypto';
import * as fs from 'fs';
// This is a hack to make Multer available in the Express namespace
type File = Express.Multer.File;
interface FileWithPath extends File {
  path: string;
}

export function encryptFile2Md5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const _file: FileWithPath = file as FileWithPath;
      const stream = fs.createReadStream(_file.path);
      const hash = crypto.createHash('md5');
      stream.on('data', (data: Buffer) => {
        hash.update(data);
      });
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      // NOTE: stream 错误不会触发外层 try/catch，必须单独监听
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}
