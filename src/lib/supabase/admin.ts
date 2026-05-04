import { createServiceClient } from "./service";

export function getAdminSupabase() {
  return createServiceClient();
}
