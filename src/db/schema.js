import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "voters",
      columns: [
        { name: "name", type: "string", isIndexed: true, isOptional: true },
        { name: "record_number", type: "string", isIndexed: true, isOptional: true },
        { name: "has_voted", type: "boolean", isOptional: true },
        { name: "pending_vote", type: "boolean", isOptional: true },
        // JSON string (via @json decorator)
        { name: "raw", type: "string", isOptional: true },
        // Watermelon @date columns must be numbers and NOT optional
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "parties",
      columns: [
        { name: "name", type: "string", isIndexed: true, isOptional: true },
        { name: "raw", type: "string", isOptional: true },
        // Watermelon @date columns must be numbers and NOT optional
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "outbox",
      columns: [
        { name: "type", type: "string", isIndexed: true },
        { name: "status", type: "string", isIndexed: true }, // pending | processing | failed
        { name: "payload", type: "string" }, // JSON string
        { name: "retry_count", type: "number", isOptional: true },
        { name: "last_error", type: "string", isOptional: true },
        // Watermelon @date columns must be numbers and NOT optional
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
  ],
});

