import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as path from 'path';
import { FilesService } from './files.service';
import { ServerInfoService } from '../server-info/server-info.service';
import { QueryDTO } from './dto/query.files.dto';
import dayjs = require('dayjs');
import { Response } from 'express';
import * as fs from 'fs';

@ApiTags('文件上传')
@Controller('files')
export class FilesController {
  constructor(
    private fileService: FilesService,
    private serverInfoService: ServerInfoService,
  ) {}

  @Get('ip')
  getServerIp(): any {
    return { ips: this.serverInfoService.getIpv4Addresses() };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFiles(
    @UploadedFile()
    file: Express.Multer.File,
  ) {

    return this.fileService.archiveUploadedFile(file);
  }

  @Delete('delete')
  async deleteFileById(@Query('id') id: string) {
    return this.fileService.deleteFileById(id);
  }

  @ApiOperation({ summary: '清空所有文件 DB 记录（不可逆，磁盘文件不受影响）' })
  @Delete('clear-all')
  async clearAll() {
    return this.fileService.clearAll();
  }

  @Patch('update/:md5')
  async updateFileDateByMd5(@Param('md5') md5: string) {
    const fileInfo = (await this.fileService.retrieveFileByCondition({
      fileMd5: md5,
    })) as unknown as { id: string | number };
    const newCreateDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
    return this.fileService.updateFileById(Number(`${fileInfo.id}`), {
      createDate: newCreateDate,
    });
  }
  @Get('info/list')
  async retrieveFilesByConditions(@Query() query: QueryDTO) {
    return this.fileService.retrieveFilesByConditions(query);
  }

  @Get('isExist/:md5')
  async retrieveFileByMd5(@Param('md5') md5: string) {
    return this.fileService.retrieveFileByCondition({ fileMd5: md5 });
  }

  @Get('download')
  async downloadFileById(@Query('id') id: string, @Res() res: Response) {
    const file = (await this.fileService.retrieveFileByCondition({
      id: Number(id),
    })) as unknown as {
      fileUrl: string;
      nameWithSuffix: string;
    };
    // fileUrl 存的是相对路径（/static/...），下载时需还原为磁盘绝对路径
    const absolutePath = path.join(process.cwd(), file.fileUrl);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.download(absolutePath, encodeURIComponent(file.nameWithSuffix));
  }
}
