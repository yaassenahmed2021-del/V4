// طبقة CORS بسيطة — التطبيق بيبعت الطلبات من نافذة Electron (أصلها file://)
// فلازم نسمح صراحة، وإلا المتصفح جوه Electron هيرفض الاستجابة.

function applyCors(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return true; // تم الرد بالفعل، وقف تنفيذ باقي الهاندلر
    }
    return false;
}

module.exports = { applyCors };
