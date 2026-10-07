CREATE TABLE "records" (
	"collection" text NOT NULL,
	"id" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "records_collection_id_pk" PRIMARY KEY("collection","id")
);
--> statement-breakpoint
CREATE INDEX "records_updated_at_idx" ON "records" USING btree ("updated_at");