/**
 * growwAuth.js — Groww API Token Manager
 * ========================================
 * Supports THREE token strategies (auto-detects based on env vars):
 *
 *  Strategy A — Direct Access Token  (GROWW_ACCESS_TOKEN is already a valid session token)
 *               Set GROWW_TOKEN_TYPE=direct in .env
 *
 *  Strategy B — TOTP Flow            (API Key + TOTP Secret → generate access token daily)
 *               Set GROWW_TOKEN_TYPE=totp in .env
 *               Requires GROWW_ACCESS_TOKEN (API key) + GROWW_API_SECRET (base32 TOTP secret)
 *               pyotp-compatible: secret is base32-decoded before HMAC-SHA1
 *
 *  Strategy C — Approval/Checksum    (API Key + Secret → HMAC-SHA256 checksum)
 *               Set GROWW_TOKEN_TYPE=approval in .env
 *               Requires GROWW_ACCESS_TOKEN (API key) + GROWW_API_SECRET
 *
 * Default: tries direct first, falls back gracefully.
 */

const crypto = require("crypto");
const axios = require("axios");

const API_KEY = process.env.GROWW_ACCESS_TOKEN;
const API_SECRET = process.env.GROWW_API_SECRET;
const TOKEN_TYPE = (process.env.GROWW_TOKEN_TYPE || "direct").toLowerCase();

// ─── Token cache ─────────────────────────────────────────────────────────────
let _cachedToken = null;
let _tokenExpiry = 0;
const TOKEN_BUFFER_MS = 5 * 60 * 1000;

// ─── TOTP (RFC 6238) — with base32 decode (pyotp-compatible) ─────────────────
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(encoded) {
    let bits = 0, value = 0;
    const output = [];
    const str = encoded.replace(/=+$/, "").toUpperCase();
    for (const char of str) {
        const idx = BASE32_CHARS.indexOf(char);
        if (idx === -1) continue; // skip invalid chars
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Buffer.from(output);
}

function generateTOTP_base32(secret, digits = 6, step = 30) {
    let keyBuffer;
    try {
        keyBuffer = base32Decode(secret);
        if (keyBuffer.length === 0) throw new Error("Empty after base32 decode");
    } catch {
        // Fallback: use raw UTF-8 bytes
        keyBuffer = Buffer.from(secret, "utf8");
    }

    const counter = Math.floor(Date.now() / 1000 / step);
    const ctrBuf = Buffer.alloc(8);
    ctrBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    ctrBuf.writeUInt32BE(counter >>> 0, 4);

    const hmac = crypto.createHmac("sha1", keyBuffer).update(ctrBuf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, digits);

    return String(code).padStart(digits, "0");
}

// ─── Approval flow checksum (HMAC-SHA256) ────────────────────────────────────
function generateChecksum(secret, timestamp) {
    return crypto.createHmac("sha256", secret).update(String(timestamp)).digest("hex");
}

// ─── Public API ───────────────────────────────────────────────────────────────
async function getGrowwAccessToken() {
    // Serve from cache if still valid
    if (_cachedToken && Date.now() < _tokenExpiry - TOKEN_BUFFER_MS) {
        return _cachedToken;
    }

    if (!API_KEY) throw new Error("GROWW_ACCESS_TOKEN not set in .env");

    // ── Strategy A: Direct token (no exchange needed) ─────────────────────────
    if (TOKEN_TYPE === "direct") {
        _cachedToken = API_KEY;
        // Decode JWT exp if possible
        try {
            const payload = JSON.parse(Buffer.from(API_KEY.split(".")[1], "base64url").toString());
            _tokenExpiry = (payload.exp ?? 0) * 1000 || Date.now() + 12 * 3600 * 1000;
        } catch {
            _tokenExpiry = Date.now() + 12 * 3600 * 1000;
        }
        console.log("[GrowwAuth] 🔑 Using direct access token.");
        return _cachedToken;
    }

    if (!API_SECRET) throw new Error("GROWW_API_SECRET not set in .env (required for totp/approval flow)");

    // ── Strategy B: TOTP ──────────────────────────────────────────────────────
    if (TOKEN_TYPE === "totp") {
        const totpCode = generateTOTP_base32(API_SECRET);
        console.log(`[GrowwAuth] 🔑 TOTP exchange (code: ${totpCode})...`);
        return await _exchangeToken({ key_type: "totp", totp: totpCode });
    }

    // ── Strategy C: Approval / Checksum ──────────────────────────────────────
    const timestamp = Math.floor(Date.now() / 1000);
    const checksum = generateChecksum(API_SECRET, timestamp);
    console.log(`[GrowwAuth] 🔑 Approval/checksum exchange...`);
    return await _exchangeToken({ key_type: "approval", checksum, timestamp: String(timestamp) });
}

async function _exchangeToken(body) {
    try {
        const { data } = await axios.post(
            "https://api.groww.in/v1/token/api/access",
            body,
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "X-API-VERSION": "1.0",
                    "Accept": "application/json",
                },
                timeout: 12000,
            }
        );

        const token = data.token ?? data.payload?.token;
        const expiry = data.expiry ?? data.payload?.expiry;

        if (!token) throw new Error("No token in response: " + JSON.stringify(data));

        _cachedToken = token;
        _tokenExpiry = expiry ? new Date(expiry).getTime() : Date.now() + 23 * 60 * 60 * 1000;
        console.log(`[GrowwAuth] ✅ Token obtained. Expires: ${new Date(_tokenExpiry).toLocaleString("en-IN")}`);
        return _cachedToken;
    } catch (err) {
        const apiErr = err.response?.data;
        const msg = apiErr?.error?.errorMessage ?? apiErr?.error?.message ?? err.message;
        console.error("[GrowwAuth] ❌ Token exchange failed:", msg, JSON.stringify(apiErr ?? {}));
        throw new Error(`Groww auth failed: ${msg}`);
    }
}

module.exports = { getGrowwAccessToken, generateTOTP_base32 };
