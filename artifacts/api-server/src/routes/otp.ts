import { Router } from "express";

const router = Router();

// ── In-memory OTP store (lightweight, no DB needed for hackathon) ──────────
interface OtpRecord {
  otp: string;
  expiry: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();

const OTP_TTL_MS = 120_000;   // 2 minutes
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Returns true if SMS was delivered, false if demo-mode fallback was used */
async function trySendSms(phone: string, otp: string): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.log(`\n${"─".repeat(50)}\n[OTP-DEMO] +91${phone} → ${otp}\n${"─".repeat(50)}\n`);
    return false;
  }

  const url = new URL("https://www.fast2sms.com/dev/bulkV2");
  url.searchParams.set("authorization", apiKey);
  url.searchParams.set("message", `Your Sapthagiri NPS University OTP is: ${otp}. Valid for 2 minutes. Do not share.`);
  url.searchParams.set("language", "english");
  url.searchParams.set("route", "q");
  url.searchParams.set("numbers", phone);

  try {
    const res = await fetch(url.toString());
    const data = (await res.json()) as { return: boolean; message?: string };
    if (data.return) return true;
    // SMS provider returned an error — fall through to demo mode
    console.log(`[OTP-DEMO] SMS failed (${data.message}). Falling back to demo mode. +91${phone} → ${otp}`);
  } catch {
    console.log(`[OTP-DEMO] SMS fetch error. Falling back. +91${phone} → ${otp}`);
  }

  return false;
}

// POST /api/otp/send  { phone: "7348913860" }
router.post("/otp/send", async (req, res) => {
  const phone = String(req.body?.phone ?? "").replace(/\D/g, "");

  if (phone.length < 7 || phone.length > 15) {
    res.status(400).json({ error: "Enter a valid phone number." });
    return;
  }

  const otp = generateOtp();
  otpStore.set(phone, { otp, expiry: Date.now() + OTP_TTL_MS, attempts: 0 });

  const smsSent = await trySendSms(phone, otp);
  if (smsSent) {
    res.json({ success: true, sms: true });
  } else {
    // Demo mode: return OTP in response so frontend can display it
    res.json({ success: true, sms: false, demo_otp: otp });
  }
});

// POST /api/otp/verify  { phone: "7348913860", otp: "123456" }
router.post("/otp/verify", (req, res) => {
  const phone = String(req.body?.phone ?? "").replace(/\D/g, "");
  const otp   = String(req.body?.otp   ?? "").trim();

  const record = otpStore.get(phone);
  if (!record) {
    res.status(400).json({ error: "No OTP found for this number. Request a new one." });
    return;
  }

  if (Date.now() > record.expiry) {
    otpStore.delete(phone);
    res.status(400).json({ error: "OTP has expired. Please request a new one." });
    return;
  }

  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(phone);
    res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    return;
  }

  if (otp !== record.otp) {
    res.status(400).json({ error: `Incorrect OTP. ${MAX_ATTEMPTS - record.attempts} attempt(s) remaining.` });
    return;
  }

  otpStore.delete(phone);
  res.json({ success: true });
});

export default router;
