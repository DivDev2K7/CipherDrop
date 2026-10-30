-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "storagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "maxDownloads" INTEGER NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "passwordHash" TEXT,
    "encryptionLevel" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active'
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "targetFile" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "shareId" TEXT,
    CONSTRAINT "ActivityLog_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Share_code_key" ON "Share"("code");
