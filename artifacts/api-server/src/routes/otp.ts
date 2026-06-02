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

async function sendSms(phone: string, otp: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    // Dev fallback: log OTP to server console (visible in Replit workflow logs)
    console.log(
      `\n${"─".repeat(50)}\n[OTP-DEV] Phone: +91${phone}  →  OTP: ${otp}\nAdd FAST2SMS_API_KEY to env for real SMS delivery.\n${"─".repeat(50)}\n`
    );
    return;
  }

  const url = new URL("https://www.fast2sms.com/dev/bulkV2");
  url.searchParams.set("authorization", apiKey);
  url.searchParams.set("variables_values", otp);
  url.searchParams.set("route", "otp");
  url.searchParams.set("numbers", phone);

  const res = await fetch(url.toString());
  const data = (await res.json()) as { return: boolean; message?: string };

  if (!data.return) {
    throw new Error(data.message ?? "Fast2SMS delivery failed");
  }
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

  try {
    await sendSms(phone, otp);
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    req.log?.error({ err }, "OTP send failed");
    res.status(500).json({ error: `SMS failed: ${msg}` });
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
