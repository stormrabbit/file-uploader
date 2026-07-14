import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import dayjs = require('dayjs');
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFileDTO } from './dto/create.files.dto';
import { UpdateFileDTO } from './dto/update.files.dto';
import { QueryDTO } from './dto/query.files.dto';
import { combineFileNameAndSuffix } from 'src/utils/file';
import { getStorageDir } from 'src/config/runtime-paths';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async archiveUploadedFile(file: Express.Multer.File) {


    // file.path 已是 Multer 写入的绝对路径，无需再与 cwd 拼接
    const tmpPath = file.path;

    try {
      if (!file.md5) {
        throw new Error('MD5 计算失败,storage engine 未返回 md5');
      }
      // service 层处理
      const existingFile = await this.retrieveFileByCondition({ fileMd5: file.md5 });
      if (existingFile) {
        fs.unlinkSync(file.path);
        return existingFile;   
      }
      const fileMd5 = file.md5
      const dateDir = dayjs().format('YYYY-MM-DD');

      const staticDir = getStorageDir();
      const storagePath = path.join(staticDir, dateDir);
      fs.mkdirSync(storagePath, { recursive: true });

      const fileDto = new CreateFileDTO();
      // path.basename 防止客户端传入路径穿越字符（如 ../../etc/passwd）
      fileDto.fileName = path.basename(file.originalname);
      fileDto.fileMd5 = fileMd5;
      fileDto.size = file.size;

      // NOTE: 同名文件去重依赖「先查 DB 再写入」，存在并发竞态条件。
      // 单用户局域网场景下并发上传同名文件的概率极低，当前实现可接受。
      // 若需彻底解决，需在 DB 对 nameWithSuffix 加唯一约束并实现重试逻辑。
      const sameNameFiles = await this.retrievePreciselyFilesByCondition({
        fileName: fileDto.fileName,
      });
      fileDto.nameSuffix =
        sameNameFiles && sameNameFiles.length ? `${sameNameFiles.length}` : '';
      fileDto.nameWithSuffix = combineFileNameAndSuffix(
        fileDto.fileName,
        fileDto.nameSuffix,
      );

      const finalFilePath = path.join(storagePath, fileDto.nameWithSuffix);
      // renameSync 在同分区内是原子操作，避免 copyFileSync + unlinkSync 的双倍 I/O
      fs.renameSync(tmpPath, finalFilePath);

      fileDto.fileUrl = `/static/${dateDir}/${fileDto.nameWithSuffix}`;

      return this.createFile(fileDto);
    } catch (err) {
      if (err.code === 'P2002') {
        // 把刚 rename 过去的文件删掉(它是重复的)
        fs.unlinkSync(tmpPath);
        // 返回对方插进去的那条记录
        return await this.retrieveFileByCondition({ fileMd5: file.md5 });
      }
      // 业务异常时清理 temp 文件，避免垃圾堆积
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
      throw err;
    }
  }

  async retrieveFilesByConditions(query: QueryDTO) {
    // HTTP Query 参数均为字符串，需显式转换为数字供 Prisma 使用
    const page = Math.max((Number(query.page) || 1) - 1, 0);
    const take = Number(query.page_size) || 10;
    const where = {
      ...(query.fileName
        ? { nameWithSuffix: { contains: query.fileName } }
        : {}),
      ...(query.fileMd5 ? { fileMd5: query.fileMd5 } : {}),
      ...(query.createDate
        ? { createDate: { gte: new Date(query.createDate) } }
        : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.file.findMany({
        where,
        skip: page * take,
        take,
        orderBy: { createDate: 'desc' },
      }),
      this.prisma.file.count({ where }),
    ]);

    return { list, total, page: query.page };
  }

  async retrievePreciselyFilesByCondition(
    query: {
      id?: string | number;
      fileMd5?: string;
      fileName?: string;
    } = {},
  ) {
    const files = await this.prisma.file.findMany({
      where: {
        ...(query.id ? { id: Number(query.id) } : {}),
        ...(query.fileMd5 ? { fileMd5: query.fileMd5 } : {}),
        ...(query.fileName ? { fileName: query.fileName } : {}),
      },
      take: 10,
      orderBy: { createDate: 'desc' },
    });
    return files.length ? files : null;
  }

  async retrieveFileByCondition(
    query: {
      id?: string | number;
      fileMd5?: string;
      fileName?: string;
    } = {},
  ) {
    const files = await this.retrievePreciselyFilesByCondition(query);
    if (files && files.length) {
      const [file] = files;
      return file;
    }
    return null;
  }

  async createFile(createDTO: CreateFileDTO) {
    return this.prisma.file.create({
      data: {
        fileName: createDTO.fileName,
        nameSuffix: createDTO.nameSuffix || '',
        nameWithSuffix: createDTO.nameWithSuffix,
        fileUrl: createDTO.fileUrl,
        fileMd5: createDTO.fileMd5,
        size: createDTO.size,
      },
    });
  }

  async updateFileById(id: number, updateDto: UpdateFileDTO) {
    return this.prisma.file.update({
      where: { id },
      data: {
        ...(updateDto.createDate
          ? { createDate: new Date(updateDto.createDate) }
          : {}),
      },
    });
  }

  async deleteFileById(id: any) {
    return this.prisma.file.delete({ where: { id: Number(id) } });
  }

  async clearAll() {
    const { count: deletedRecords } = await this.prisma.file.deleteMany();
    return { deletedRecords };
  }
}
