-- CreateTable
CREATE TABLE "Trip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "country" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "travelType" TEXT,
    "rating" INTEGER,
    "notes" TEXT,
    "highlights" TEXT,
    "favoriteMemory" TEXT,
    "weatherMemory" TEXT,
    "photoUrl" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
