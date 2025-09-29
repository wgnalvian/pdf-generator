import crypto from "crypto";
import { Payload } from "./types";
import { TRPCError } from "@trpc/server";

const ALGO = "aes-256-gcm";
const KEY = process.env.TOKEN_KEY
    ? Buffer.from(process.env.TOKEN_KEY, "hex")
    : crypto.randomBytes(32);

function b64u(buf: Buffer) {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64uDecode(s: string) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return Buffer.from(s, "base64");
}

export function encryptToken(data: Payload, ttlSeconds = 3600) {
    const iv = crypto.randomBytes(12);
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const payload: Payload = { ...data, exp };
    const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
    const cipher = crypto.createCipheriv(ALGO, KEY, iv, { authTagLength: 16 });
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [b64u(iv), b64u(authTag), b64u(encrypted)].join(".");
}

export function decryptToken(token: string): Payload {
    const parts = token.split(".");
    if (parts.length !== 3) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid token" });
    const iv = b64uDecode(parts[0]);
    const authTag = b64uDecode(parts[1]);
    const ciphertext = b64uDecode(parts[2]);

    const decipher = crypto.createDecipheriv(ALGO, KEY, iv, { authTagLength: 16 });
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const payload = JSON.parse(decrypted.toString("utf8")) as Payload;

    if (Math.floor(Date.now() / 1000) > payload.exp) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token expired" });

    return payload;
}