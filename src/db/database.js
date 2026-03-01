import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import { schema } from "./schema";
import { migrations } from "./migrations";

import Voter from "./models/Voter";
import Party from "./models/Party";
import OutboxItem from "./models/OutboxItem";

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: "representative_dashboard",
  jsi: true,
  onSetUpError: (error) => {
    // eslint-disable-next-line no-console
    console.error("WatermelonDB setup error:", error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Voter, Party, OutboxItem],
});

