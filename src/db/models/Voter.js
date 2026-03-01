import { Model } from "@nozbe/watermelondb";
import { date, field, json, text } from "@nozbe/watermelondb/decorators";

const sanitizeRaw = (raw) => raw || null;

export default class Voter extends Model {
  static table = "voters";

  @text("name") name;
  @text("record_number") recordNumber;

  @field("has_voted") hasVoted;
  @field("pending_vote") pendingVote;

  @json("raw", sanitizeRaw) raw;

  @date("updated_at") updatedAt;
}

