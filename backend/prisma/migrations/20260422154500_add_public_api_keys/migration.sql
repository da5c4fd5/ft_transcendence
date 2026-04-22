ALTER TABLE "users"
ADD COLUMN "publicApiKeyHash" TEXT,
ADD COLUMN "publicApiKeyPreview" VARCHAR(64),
ADD COLUMN "publicApiKeyCreatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_publicApiKeyHash_key" ON "users"("publicApiKeyHash");
