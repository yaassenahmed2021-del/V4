// طبقة موحّدة لالتقاط أي استثناء غير متوقع (زي مشاكل الاتصال بـ KV)
// وتحويله لرد JSON واضح بدل ما يسقط كـ 500 بلا تفاصيل.
//
// أي خطأ فعلي بيتطبع كامل في Vercel Logs (تبويب Logs / Functions في
// لوحة تحكم المشروع) عشان تقدر تشخّصه، لكن الرد اللي بيوصل للعميل
// بيفضّل يكون رسالة عامة (من غير تفاصيل تقنية حساسة) إلا لو حددت
// خلاف ذلك.

function withErrorHandling(routeName, fn) {
    return async (req, res) => {
        try {
            await fn(req, res);
        } catch (err) {
            console.error(`[${routeName}] Unhandled error:`, err);

            // لو الرد اتبعت بالفعل قبل ما يحصل الخطأ، متحاولش تبعت تاني
            if (res.headersSent) return;

            // نحاول نكتشف مشكلة KV تحديداً عشان الرسالة تكون مفيدة وقت التطوير
            const isKvConfigError =
                err && typeof err.message === "string" &&
                /KV_REST_API_URL|KV_REST_API_TOKEN|@vercel\/kv/i.test(err.message);

            const message = isKvConfigError
                ? "قاعدة البيانات (KV) غير مربوطة بالمشروع بشكل صحيح. راجع إعدادات Storage في Vercel."
                : "حدث خطأ غير متوقع في السيرفر";

            return res.status(500).json({
                success: false,
                message
            });
        }
    };
}

module.exports = { withErrorHandling };
