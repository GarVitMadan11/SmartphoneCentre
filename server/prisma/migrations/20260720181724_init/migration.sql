-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "releaseYear" INTEGER NOT NULL,
    "basePrice128GB" INTEGER NOT NULL,
    "series" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Model_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelLegacyId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL DEFAULT '',
    "storageGb" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pickupDate" TEXT NOT NULL,
    "pickupTimeSlot" TEXT NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verifiedName" TEXT NOT NULL DEFAULT '',
    "maskedAadhaar" TEXT NOT NULL DEFAULT '',
    "verificationDate" TEXT NOT NULL DEFAULT '',
    "payoutMethod" TEXT NOT NULL,
    "payoutMethodName" TEXT NOT NULL,
    "bonusPercentage" REAL NOT NULL DEFAULT 0,
    "bonusAmount" INTEGER NOT NULL DEFAULT 0,
    "finalPayoutAmount" INTEGER NOT NULL,
    "inspectionStatus" TEXT NOT NULL DEFAULT 'pending',
    "payoutStatus" TEXT NOT NULL DEFAULT 'pending',
    "dateCreated" TEXT NOT NULL,
    "payoutDetailsJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Model_legacyId_key" ON "Model"("legacyId");

-- CreateIndex
CREATE INDEX "Model_brandId_idx" ON "Model"("brandId");

-- CreateIndex
CREATE INDEX "Model_category_idx" ON "Model"("category");
