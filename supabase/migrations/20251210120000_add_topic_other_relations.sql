-- Create topic_other_relations table for non-parent-child directional relationships
CREATE TABLE "public"."topic_other_relations" (
    "from_topic_id" bigint NOT NULL,
    "to_topic_id" bigint NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT NOW(),
    "updated_at" timestamp with time zone DEFAULT NOW(),
    PRIMARY KEY ("from_topic_id", "to_topic_id"),
    FOREIGN KEY ("from_topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE,
    FOREIGN KEY ("to_topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE,
    CONSTRAINT "no_self_reference" CHECK ("from_topic_id" != "to_topic_id")
);

-- Create indexes for efficient bidirectional queries
CREATE INDEX idx_topic_other_relations_from ON topic_other_relations(from_topic_id);
CREATE INDEX idx_topic_other_relations_to ON topic_other_relations(to_topic_id);
