const { kv } = require("../lib/kv");
const { applyCors } = require("../lib/cors");
const { withErrorHandling } = require("../lib/handler");
const { MONTHLY_KEYS, YEARLY_KEYS } = require("../keys");

const PLAN_DURATIONS_MS = {
    monthly: 30 * 24 * 60 * 60 * 1000,
    yearly: 365 * 24 * 60 * 60 * 1000
};

// بيدوّر على الكود في المصفوفتين اللي انت كاتبهم يدوياً في keys.js
// ويرجّع الباقة المسجّل تحتها، أو null لو الكود مش موجود خالص.
function findPlanForKey(key) {
    if (MONTHLY_KEYS.includes(key)) return "monthly";
    if (YEARLY_KEYS.includes(key)) return "yearly";
    return null;
}

// POST /api/activate   body: { deviceId, name, key, plan }
// -> { success, message?, plan?, expiresAt? }
module.exports = withErrorHandling("activate", async (req, res) => {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { deviceId, name, key, plan } = req.body || {};

    if (!deviceId || !name || !key || !plan) {
        return res.status(400).json({ success: false, message: "بيانات ناقصة" });
    }

    const registeredPlan = findPlanForKey(key);

    if (!registeredPlan) {
        return res.status(200).json({ success: false, message: "مفتاح التفعيل غير صحيح" });
    }

    if (registeredPlan !== plan) {
        return res.status(200).json({ success: false, message: "هذا المفتاح لا يخص الباقة المختارة" });
    }

    const keyRecord = (await kv.get(`key:${key}`)) || { used: false };

    // الكود مستخدم بالفعل على جهاز مختلف
    if (keyRecord.used && keyRecord.deviceId !== deviceId) {
        return res.status(200).json({ success: false, message: "المفتاح غير صحيح أو تم استخدامه من قبل!" });
    }

    const expiresAt = Date.now() + PLAN_DURATIONS_MS[registeredPlan];

    keyRecord.used = true;
    keyRecord.deviceId = deviceId;
    keyRecord.name = name;
    keyRecord.plan = registeredPlan;
    keyRecord.usedAt = Date.now();
    await kv.set(`key:${key}`, keyRecord);

    const device = (await kv.get(`device:${deviceId}`)) || {};
    device.activated = true;
    device.plan = registeredPlan;
    device.expiresAt = expiresAt;
    device.name = name;
    device.activatedKey = key;
    await kv.set(`device:${deviceId}`, device);

    return res.status(200).json({ success: true, plan: registeredPlan, expiresAt });
});
