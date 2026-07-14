/*
  Warnings:

  - A unique constraint covering the columns `[fileMd5]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_fileMd5_key" ON "File"("fileMd5");
