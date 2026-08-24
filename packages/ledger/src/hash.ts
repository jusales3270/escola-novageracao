import { createHash } from "node:crypto";

export function sha256Hex(material: string): string {
  return createHash("sha256").update(material, "utf8").digest("hex");
}
