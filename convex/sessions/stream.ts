import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";
import { ValidationError } from "../lib/validation";

const TOKEN_TTL_SECONDS = 60 * 60;

interface CallAccess {
  userId: Id<"users">;
  userName: string;
  callId: string;
}

const encoder = new TextEncoder();

function base64url(input: string | ArrayBuffer) {
  const bytes =
    typeof input === "string" ? encoder.encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signJwt(payload: Record<string, unknown>, secret: string) {
  const unsigned = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64url(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(unsigned));
  return `${unsigned}.${base64url(signature)}`;
}

// token is scoped to this session's call only
export const getCallToken = action({
  args: { sessionId: v.id("learningSessions") },
  handler: async (ctx, args): Promise<CallAccess & { token: string }> => {
    const access: CallAccess = await ctx.runQuery(internal.sessions.queries.getCallAccess, {
      sessionId: args.sessionId,
    });

    const secret = process.env.STREAM_API_SECRET;
    if (!secret) {
      throw new ValidationError("Video calls aren't set up yet");
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await signJwt(
      {
        user_id: access.userId,
        call_cids: [`default:${access.callId}`],
        iat: now - 5,
        exp: now + TOKEN_TTL_SECONDS,
      },
      secret,
    );

    return { token, ...access };
  },
});
