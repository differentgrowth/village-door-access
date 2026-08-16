-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "current_code" TEXT,
    "rotated_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "visitor_name" TEXT NOT NULL,
    "access_code" TEXT NOT NULL,
    "visited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_error" TEXT,
    "location_id" TEXT NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "location_id" TEXT NOT NULL,

    CONSTRAINT "access_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE INDEX "visits_visited_at_idx" ON "visits"("visited_at" DESC);

-- CreateIndex
CREATE INDEX "visits_location_id_idx" ON "visits"("location_id");

-- CreateIndex
CREATE INDEX "access_codes_started_at_idx" ON "access_codes"("started_at" DESC);

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one current Access Code per Location (not expressible in schema.prisma).
CREATE UNIQUE INDEX "access_codes_one_current"
  ON "access_codes" ("location_id")
  WHERE "ended_at" IS NULL;

-- Seed Location Acceso 1 so migrate deploy is enough.
INSERT INTO "locations" ("id", "name")
VALUES ('00000000-0000-4000-8000-000000000001', 'Acceso 1')
ON CONFLICT ("id") DO NOTHING;
