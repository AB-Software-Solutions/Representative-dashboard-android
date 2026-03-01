import { Model } from "@nozbe/watermelondb";
import { date, field, json, text } from "@nozbe/watermelondb/decorators";

const sanitizePayload = (raw) => raw || null;

export default class OutboxItem extends Model {
  static table = "outbox";

  @text("type") type;
  @text("status") status;
  @json("payload", sanitizePayload) payload;

  @field("retry_count") retryCount;
  @text("last_error") lastError;

  @date("created_at") createdAt;
  @date("updated_at") updatedAt;
}

