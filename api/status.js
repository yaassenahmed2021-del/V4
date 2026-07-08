const { kv } = require("../lib/kv");
const { applyCors } = require("../lib/cors");
const { withErrorHandling } = require("../lib/handler");

// POST /api/status   body: { deviceId }
// -> { activated, plan, expiresAt, trialStarted, trialExpiresAt }
module.exports = withErrorHandling("status", async (req, res) => {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { deviceId } = req.body || {};
    if (!deviceId) {
        return res.status(400).json({ message: "deviceId مطلوب" });
    }

    const device = (await kv.get(`device:${deviceId}`)) || {};

    // لو الباقة انتهت، اعتبرها غير مفعّلة تلقائياً
    if (device.activated && device.expiresAt && device.expiresAt <= Date.now()) {
        device.activated = false;
        await kv.set(`device:${deviceId}`, device);
    }

    return res.status(200).json({
        activated: !!device.activated,
        plan: device.activated ? device.plan || null : null,
        expiresAt: device.activated ? device.expiresAt || null : null,
        trialStarted: !!device.trialStarted,
        trialExpiresAt: device.trialExpiresAt || null
    });
});
