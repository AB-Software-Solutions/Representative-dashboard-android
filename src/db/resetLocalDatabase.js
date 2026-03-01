/* eslint-disable no-console */

import { database } from "./database";

export async function resetLocalDatabase() {
  // WatermelonDB requires this to run inside a Writer.
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}

