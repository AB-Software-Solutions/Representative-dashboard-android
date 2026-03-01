import { Model } from "@nozbe/watermelondb";
import { date, json, text } from "@nozbe/watermelondb/decorators";

const sanitizeRaw = (raw) => raw || null;

export default class Party extends Model {
  static table = "parties";

  @text("name") name;
  @json("raw", sanitizeRaw) raw;
  @date("updated_at") updatedAt;
}

