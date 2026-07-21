-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromValue" TEXT NOT NULL DEFAULT '',
    "toValue" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
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
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "payoutDetailsJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Booking" ("address", "bonusAmount", "bonusPercentage", "color", "createdAt", "customerEmail", "customerName", "customerPhone", "dateCreated", "finalPayoutAmount", "finalPrice", "id", "inspectionStatus", "maskedAadhaar", "modelLegacyId", "modelName", "modelNumber", "payoutDetailsJson", "payoutMethod", "payoutMethodName", "payoutStatus", "pickupDate", "pickupTimeSlot", "storageGb", "updatedAt", "verificationDate", "verificationStatus", "verifiedName") SELECT "address", "bonusAmount", "bonusPercentage", "color", "createdAt", "customerEmail", "customerName", "customerPhone", "dateCreated", "finalPayoutAmount", "finalPrice", "id", "inspectionStatus", "maskedAadhaar", "modelLegacyId", "modelName", "modelNumber", "payoutDetailsJson", "payoutMethod", "payoutMethodName", "payoutStatus", "pickupDate", "pickupTimeSlot", "storageGb", "updatedAt", "verificationDate", "verificationStatus", "verifiedName" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_inspectionStatus_idx" ON "Booking"("inspectionStatus");
CREATE INDEX "Booking_payoutStatus_idx" ON "Booking"("payoutStatus");
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX "Booking_customerPhone_idx" ON "Booking"("customerPhone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BookingEvent_bookingId_idx" ON "BookingEvent"("bookingId");

-- CreateIndex
CREATE INDEX "BookingEvent_createdAt_idx" ON "BookingEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
