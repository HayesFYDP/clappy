-- CreateTable
CREATE TABLE "ProductivityRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "isProductive" BOOLEAN NOT NULL,
    "confidence" REAL NOT NULL,
    "justification" TEXT NOT NULL
);
