const crypto = require('crypto');
global.crypto = crypto;
const http = require("http")
http.createServer((req,res)=>res.end("Bot Live")).listen(process.env.PORT||3000)

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const P = require("pino")

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0"]
  })

  if (!sock.authState.creds.registered) {
    const num = process.env.PHONE_NUMBER
    if (num) {
      console.log("طلب كود للرقم:", num)
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(num)
          console.log(`\n====================`)
          console.log(`🔑 كودك: ${code}`)
          console.log(`====================\n`)
          console.log("واتساب > الاجهزة المرتبطة > ربط برقم الهاتف")
        } catch (e) { console.log("خطأ:", e.message) }
      }, 3000)
    }
  }

  sock.ev.on("creds.update", saveCreds)
  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") console.log("✅ ارتبط! شغال 24/7")
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) start()
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
