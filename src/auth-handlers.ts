// Re-export of the Auth.js handlers separated from src/auth.ts so the
// catch-all route only loads the HTTP handlers (not the auth() helper).
export { handlers as authHandlers } from "@/auth";
import { handlers } from "@/auth";
export const GET = handlers.GET;
export const POST = handlers.POST;
