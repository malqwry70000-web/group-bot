const crypto = require('crypto');
global.crypto = crypto;
const http = require("http")
http.createServer((req,res)=>res.end("Bot Live")).listen(process.env.PORT||3000)

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const P = require("pino")

let pairingRequested = false; // عشان ما يطلب اكثر من مرة

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  if (!sock.authState.creds.registered &&!pairingRequested) {
    pairingRequested = true
    const num = "967738100848" // رقمك بدون +
    console.log("جاري طلب الكود للرقم:", num)

    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(num)
        console.log(`\n====================`)
        console.log(`🔑 كودك: ${code}`)
        console.log(`====================\n`)
        console.log("معك دقيقة واحدة فقط ادخله!")
      } catch (e) {
        console.log("خطأ:", e.message)
        pairingRequested = false // يسمح يحاول بعدين
      }
    }, 8000) // ينتظر 8 ثواني عشان يثبت الاتصال
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ ارتبط! شغال 24/7")
      pairingRequested = false
    }
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
      console.log("انقطع الاتصال، اعادة تشغيل بعد 15 ثانية...")
      if(shouldReconnect){
        setTimeout(start, 15000) // كان يعيد بسرعة، الحين 15 ثانية
      }else{
        console.log("تم تسجيل الخروج")
      }
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m?.message || m.key.fromMe) return
    const from = m.key.remoteJid
    const txt = m.message.conversation || m.message.extendedTextMessage?.text || ""
    if (txt.toLowerCase() === "ping") await sock.sendMessage(from, { text: "pong ✅" })
  })
}
start()
