/**
 * 同名文件时增加后缀
 * @param fileName
 * @param suffix
 * @returns
 */
export const combineFileNameAndSuffix = (fileName: string, suffix: string) => {
  const index = fileName.lastIndexOf('.');
  return `${fileName.substring(0, index)}${
    suffix ? `_${suffix}` : ''
  }${fileName.substring(index)}`;
};
