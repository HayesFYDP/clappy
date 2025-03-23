/*
  Warnings:

  - You are about to drop the column `communicationIsContinuousInput` on the `Settings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blacklistPrograms" TEXT NOT NULL,
    "blacklistSites" TEXT NOT NULL,
    "permissionScreenshot" BOOLEAN NOT NULL,
    "permissionMicrophone" BOOLEAN NOT NULL,
    "permissionWindowControl" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Settings" ("blacklistPrograms", "blacklistSites", "id", "permissionMicrophone", "permissionScreenshot") SELECT "blacklistPrograms", "blacklistSites", "id", "permissionMicrophone", "permissionScreenshot" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
