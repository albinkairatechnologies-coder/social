-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" DATETIME,
    "platformUsername" TEXT,
    "platformDisplayName" TEXT,
    "platformAvatarUrl" TEXT,
    "pages" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("accessToken", "createdAt", "expiresAt", "id", "pages", "platformAvatarUrl", "platformDisplayName", "platformUsername", "provider", "providerAccountId", "refreshToken", "updatedAt", "userId") SELECT "accessToken", "createdAt", "expiresAt", "id", "pages", "platformAvatarUrl", "platformDisplayName", "platformUsername", "provider", "providerAccountId", "refreshToken", "updatedAt", "userId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
