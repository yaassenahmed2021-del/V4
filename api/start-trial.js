const { kv } = require("../lib/kv");
const { applyCors } = require("../lib/cors");

// مدة التجربة 24 ساعة، زي ما هو موضّح في زرار activation.html
const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000;

// POST /api/start-trial   body: { deviceId }
// -> { success, trialExpiresAt?, message? }
module.exports = async (req, res) => {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { deviceId } = req.body || {};
    if (!deviceId) {
        return res.status(400).json({ success: false, message: "deviceId مطلوب" });
    }

    const device = (await kv.get(`device:${deviceId}`)) || {};

    // تجربة استُخدمت من قبل على هذا الجهاز (حتى لو انتهت الآن)
    if (device.trialUsed) {
        return res.status(200).json({
            success: false,
            message: "عذراً، لقد استخدمت الفترة التجريبية مسبقاً على هذا الجهاز."
        });
    }

    // تجربة شغّالة بالفعل — رجّع نفس الميعاد بدل ما نبدأ واحدة جديدة
    if (device.trialStarted && device.trialExpiresAt) {
        return res.status(200).json({ success: true, trialExpiresAt: device.trialExpiresAt });
    }

    const trialExpiresAt = Date.now() + TRIAL_DURATION_MS;
    device.trialStarted = true;
    device.trialUsed = true;
    device.trialExpiresAt = trialExpiresAt;

    await kv.set(`device:${deviceId}`, device);

    return res.status(200).json({ success: true, trialExpiresAt });
};
