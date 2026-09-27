-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerCountry" TEXT,
    "accessToken" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "holdExpiresAt" DATETIME,
    "payLater" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" DATETIME,
    "locale" TEXT NOT NULL DEFAULT 'EN',
    "experienceId" TEXT NOT NULL,
    "experienceTitle" TEXT NOT NULL,
    "experienceImage" TEXT,
    "destination" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "people" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "benefitCode" TEXT,
    "discountPct" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "confirmedAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "confirmationEmailSentAt" DATETIME,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("accessToken", "benefitCode", "cancelledAt", "code", "completedAt", "confirmationEmailSentAt", "confirmedAt", "createdAt", "currency", "customerCountry", "customerEmail", "customerName", "customerPhone", "date", "destination", "discountCents", "discountPct", "experienceId", "experienceImage", "experienceTitle", "holdExpiresAt", "id", "idempotencyKey", "isTest", "locale", "paidAt", "people", "status", "subtotalCents", "termsAcceptedAt", "totalCents", "unitPriceCents", "updatedAt", "userId") SELECT "accessToken", "benefitCode", "cancelledAt", "code", "completedAt", "confirmationEmailSentAt", "confirmedAt", "createdAt", "currency", "customerCountry", "customerEmail", "customerName", "customerPhone", "date", "destination", "discountCents", "discountPct", "experienceId", "experienceImage", "experienceTitle", "holdExpiresAt", "id", "idempotencyKey", "isTest", "locale", "paidAt", "people", "status", "subtotalCents", "termsAcceptedAt", "totalCents", "unitPriceCents", "updatedAt", "userId" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");
CREATE UNIQUE INDEX "bookings_accessToken_key" ON "bookings"("accessToken");
CREATE UNIQUE INDEX "bookings_idempotencyKey_key" ON "bookings"("idempotencyKey");
CREATE INDEX "bookings_userId_createdAt_idx" ON "bookings"("userId", "createdAt");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_experienceId_date_status_idx" ON "bookings"("experienceId", "date", "status");
CREATE INDEX "bookings_customerEmail_idx" ON "bookings"("customerEmail");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_experienceId_key" ON "favorites"("userId", "experienceId");
