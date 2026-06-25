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
      stream.on('data', (data: string) => {
        hash.update(data, 'utf8');
      });
      stream.on('end', () => {
        const md5 = hash.digest('hex');
        console.log(`md5: ${md5}`);
        resolve(md5);
      });
    } catch (error) {
      console.warn(error);
      reject(error);
    }
  });
}
