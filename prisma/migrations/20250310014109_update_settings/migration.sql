/*
  Warnings:

  - You are about to drop the column `blacklist` on the `Settings` table. All the data in the column will be lost.
  - Added the required column `blacklistPrograms` to the `Settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blacklistSites` to the `Settings` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "communicationIsContinuousInput" BOOLEAN NOT NULL,
    "blacklistPrograms" TEXT NOT NULL,
    "blacklistSites" TEXT NOT NULL,
    "permissionScreenshot" BOOLEAN NOT NULL,
    "permissionMicrophone" BOOLEAN NOT NULL
);
INSERT INTO "new_Settings" ("communicationIsContinuousInput", "id", "permissionMicrophone", "permissionScreenshot") SELECT "communicationIsContinuousInput", "id", "permissionMicrophone", "permissionScreenshot" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
