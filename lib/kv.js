// طبقة وسيطة فوق Vercel KV (Upstash Redis).
//
// قبل الديبلوي: افتح مشروعك في لوحة تحكم Vercel -> تبويب Storage ->
// اعمل Create Database من نوع KV واربطه بالمشروع. Vercel هيضيف
// المتغيرات البيئية (KV_REST_API_URL, KV_REST_API_TOKEN, ...) تلقائياً
// لمشروعك، فمش محتاج تكتبهم يدوياً.

const { kv } = require("@vercel/kv");

module.exports = { kv };
