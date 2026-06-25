-- CreateTable
CREATE TABLE "File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "nameSuffix" TEXT NOT NULL DEFAULT '',
    "nameWithSuffix" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileMd5" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "createDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "File_fileMd5_idx" ON "File"("fileMd5");

-- CreateIndex
CREATE INDEX "File_createDate_idx" ON "File"("createDate");
