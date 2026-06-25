import { ApiProperty } from '@nestjs/swagger';

export class CreateFileDTO {
  @ApiProperty({
    name: '文件名',
    description: '上传 sketch 文件名',
  })
  fileName: string;
  @ApiProperty({
    name: '同名后缀',
    description: '相同名称时用以标记不同的文件',
  })
  nameSuffix?: string;
  @ApiProperty({
    name: '加上后缀的名称',
    description: '相同名称时用以标记不同的文件',
  })
  nameWithSuffix: string;
  @ApiProperty({
    name: '文件路径',
    description: '上传 sketch 文件的保存路径',
  })
  fileUrl: string;
  @ApiProperty({
    name: '创建时间',
    description: '文件创建时间',
  })
  createDate: any;
  @ApiProperty({
    name: 'md5',
    description: '文件md5值',
  })
  fileMd5?: string;

  @ApiProperty({
    name: 'md5',
    description: '文件md5值',
  })
  size: number;

  @ApiProperty({
    name: '父级目录',
    description: '文件的上级目录',
  })
  parentDir?: string;
  @ApiProperty({
    name: '当前目录',
    description: '文件的当前目录',
  })
  currentDir: string;
  @ApiProperty({
    name: '是否是文件夹',
  })
  isFileDir: boolean;
}
