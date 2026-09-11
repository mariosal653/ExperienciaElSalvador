/*
  Warnings:

  - Added the required column `accessToken` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerEmail` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experienceId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "capacity" INTEGER,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reference" TEXT NOT NULL,
    "providerLinkId" TEXT,
    "checkoutUrl" TEXT,
    "providerTransactionId" TEXT,
    "authorizationCode" TEXT,
    "isRealTransaction" BOOLEAN,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approvedAt" DATETIME,
    CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "experienceId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    "cancelledAt" DATETIME,
    CONSTRAINT "tickets_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
-- Migración de datos (editada a mano sobre lo que generó Prisma):
--  * Las reservas existentes pertenecen a una cuenta: el comprador es ese
--    usuario. El teléfono no se pedía antes; queda vacío.
--  * Cada reserva recibe su llave de acceso aleatoria (256 bits).
--  * PENDING pasa a llamarse PENDING_PAYMENT.
--  * Todas se crearon SIN pago (el endpoint anterior confirmaba sin cobrar),
--    así que se marcan como de prueba.
INSERT INTO "new_bookings" ("benefitCode", "cancelledAt", "code", "completedAt", "createdAt", "currency", "date", "destination", "discountCents", "discountPct", "experienceId", "experienceImage", "experienceTitle", "id", "people", "status", "subtotalCents", "totalCents", "unitPriceCents", "updatedAt", "userId", "customerName", "customerEmail", "customerPhone", "accessToken", "isTest", "confirmedAt")
SELECT b."benefitCode", b."cancelledAt", b."code", b."completedAt", b."createdAt", b."currency", b."date", b."destination", b."discountCents", b."discountPct", b."experienceId", b."experienceImage", b."experienceTitle", b."id", b."people",
       CASE b."status" WHEN 'PENDING' THEN 'PENDING_PAYMENT' ELSE b."status" END,
       b."subtotalCents", b."totalCents", b."unitPriceCents", b."updatedAt", b."userId",
       COALESCE(u."name", u."email", ''), COALESCE(u."email", ''), '',
       lower(hex(randomblob(32))), true,
       CASE WHEN b."status" IN ('CONFIRMED', 'COMPLETED') THEN b."createdAt" ELSE NULL END
FROM "bookings" b LEFT JOIN "users" u ON u."id" = b."userId";
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
CREATE UNIQUE INDEX "availability_experienceId_date_key" ON "availability"("experienceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerTransactionId_key" ON "payments"("providerTransactionId");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_code_key" ON "tickets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_token_key" ON "tickets"("token");

-- CreateIndex
CREATE INDEX "tickets_experienceId_date_idx" ON "tickets"("experienceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_bookingId_number_key" ON "tickets"("bookingId", "number");
