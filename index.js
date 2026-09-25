const crypto = require('crypto');
global.crypto = crypto;
const fs = require("fs");
const http = require("http")
http.createServer((req,res)=>res.end("Bot Live")).listen(process.env.PORT||3000)

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const P = require("pino")

async function start() {
  // احذف الجلسة القديمة اذا فاسدة
  if(fs.existsSync("auth/creds.json")){
    const data = fs.readFileSync("auth/creds.json","utf8")
    if(data.length < 100){
      fs.rmSync("auth", {recursive:true, force:true})
      console.log("تم حذف الجلسة الفاسدة")
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["Brave", "Chrome", "99.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  // يطلب الكود مرة وحدة بس
  if (!sock.authState.creds.registered) {
    console.log("انتظر 10 ثواني ثم سيظهر الكود...")
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode("967738100848")
        console.log("\n===================")
        console.log("كودك: " + code)
        console.log("===================\n")
      } catch(e){
        console.log("خطأ: " + e.message)
        console.log("انتظر 5 دقائق وحاول مرة اخرى")
        process.exit(1) // يوقف وما يعيد
      }
    }, 10000)
  }

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") console.log("✅ تم الربط بنجاح! شغال")
    if (connection === "close") console.log("انقطع - شغل السيرفس يدوي بعد 5 دقائق")
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m?.message || m.key.fromMe) return
    const txt = m.message.conversation || m.message.extendedTextMessage?.text || ""
    if (txt.toLowerCase() === "ping") await sock.sendMessage(m.key.remoteJid, { text: "pong ✅" })
  })
}
start()
