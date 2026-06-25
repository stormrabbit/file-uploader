import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import dayjs = require('dayjs');
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFileDTO } from './dto/create.files.dto';
import { UpdateFileDTO } from './dto/update.files.dto';
import { QueryDTO } from './dto/query.files.dto';
import { encryptFile2Md5 } from 'src/utils/cryptogram';
import { combineFileNameAndSuffix } from 'src/utils/file';
import { getStaticDir } from 'src/config/runtime-paths';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async archiveUploadedFile(file: Express.Multer.File) {
    // file.path 已是 Multer 写入的绝对路径，无需再与 cwd 拼接
    const tmpPath = file.path;
    const fileMd5 = await encryptFile2Md5(file);
    const dateDir = dayjs().format('YYYY-MM-DD');

    const staticDir = getStaticDir();
    const storagePath = path.join(staticDir, dateDir);
    fs.mkdirSync(storagePath, { recursive: true });

    const fileDto = new CreateFileDTO();
    fileDto.fileName = file.originalname;
    fileDto.fileMd5 = fileMd5;
    fileDto.size = file.size;
    fileDto.createDate = dayjs().format('YYYY-MM-DD HH:mm:ss');

    const sameNameFiles = await this.retrievePreciselyFilesByCondition({
      fileName: file.originalname,
    });
    fileDto.nameSuffix =
      sameNameFiles && sameNameFiles.length ? `${sameNameFiles.length}` : '';
    fileDto.nameWithSuffix = combineFileNameAndSuffix(
      fileDto.fileName,
      fileDto.nameSuffix,
    );

    const finalFilePath = path.join(storagePath, fileDto.nameWithSuffix);
    fs.copyFileSync(tmpPath, finalFilePath);
    fs.unlinkSync(tmpPath);

    fileDto.fileUrl = `/static/${dateDir}/${fileDto.nameWithSuffix}`;

    return this.createFile(fileDto);
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
