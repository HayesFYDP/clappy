-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "communicationIsContinuousInput" BOOLEAN NOT NULL,
    "blacklist" TEXT NOT NULL,
    "permissionScreenshot" BOOLEAN NOT NULL,
    "permissionMicrophone" BOOLEAN NOT NULL
);
