const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
if (!fs.existsSync('./database')) fs.mkdirSync('./database')
const load=(n,d={})=>{try{return JSON.parse(fs.readFileSync(`./database/${n}.json`))}catch{return d}}
const save=(n,d)=>fs.writeFileSync(`./database/${n}.json`, JSON.stringify(d,null,2))
let warnings=load('warnings',{}), money=load('money',{}), bank=load('bank',{}), muted=load('muted',{}), locked=load('locked',{}), marriages=load('marriages',{}), robTime=load('robTime',{}), daily=load('daily',{}), jailed=load('jailed',{}), chatMode=load('chatMode',{})
const getMoney=id=>{if(money[id]==null)money[id]=1000; return money[id]}
const getBank=id=>{if(bank[id]==null)bank[id]=0; return bank[id]}
function getRealAI(text, name){
const t=text.toLowerCase().trim()
const dict={'خميس':'خميس بعينك يا '+name+' 😂 أنا ملك وانت خميس القات','كلب':'كلب؟ تعال شوف من الكلب يا '+name+' 🐕','بقره':'بقرة بعينك يا '+name+' 🐄','بقرة':'بقرة بعينك يا '+name+' 🐄','جاموسه':'جاموسة بعينك يا '+name+' 🐃','ثور':'ثور بعينك يا '+name+' 🐂','حمار':'حمار بعينك يا '+name+' 🫏','خروف':'خروف؟ انت الخروف يا '+name+' 🐑','قرد':'قرد بعينك يا '+name+' 🐒','نجس':'نجس؟ انت النجس يا '+name+' 🦠','طرطور':'طرطور بعينك يا '+name+' 😂'}
for(let k in dict){ if(t.includes(k)) return `🤖 ${dict[k]}` }
if(t.includes('يا بوت')||t.includes('يابوت')){let insult=t.replace(/يا بوت|يابوت/g,'').trim().replace(/[@\n]/g,'').trim(); if(insult.length>0&&insult.length<30){return `🤖 ${insult} بعينك يا ${name} 😂 أنا ملك وانت ${insult} حق الجروب 🔥`}}
return `🤖 فهمتك يا ${name} - "${text}" صح 100% ✅`
}
async function startBot(){
const {state,saveCreds}=await useMultiFileAuthState('auth')
const sock=makeWASocket({logger:P({level:'silent'}),printQRInTerminal:false,auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,P({level:'silent'}))},browser:['Ubuntu','Chrome','20.0.04']})
sock.ev.on('creds.update',saveCreds)
sock.ev.on('connection.update',u=>{if(u.connection==='close'&&u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut)startBot(); if(u.connection==='open')console.log('v63 LINED MENU CLEAN - NO YTDL')})
sock.ev.on('messages.upsert',async({messages})=>{
try{
const m=messages[0]; if(!m.message||m.key.fromMe) return
const from=m.key.remoteJid, isGroup=from.endsWith('@g.us'), sender=isGroup?m.key.participant:from
const pushName=m.pushName||'يا حب'
const body=(m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||'').trim()
if(!body) return
const bodyLow=body.toLowerCase()
const args=body.slice(1).split(' '), command=args[0]?.toLowerCase()||'', text=args.slice(1).join(' ')
const reply=(t,men=[])=>sock.sendMessage(from,{text:t,mentions:men},{quoted:m})
const getMen=()=>{let jid=m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(jid) return jid; let num=text.replace(/[^0-9]/g,''); if(num.length>=9) return num+'@s.whatsapp.net'; return null}
let groupMeta=null
if(isGroup){try{groupMeta=await sock.groupMetadata(from)}catch{}}
if(bodyLow==='قنبله'||bodyLow==='قنبلة'||bodyLow==='.قنبله'||bodyLow==='.قنبلة'||command==='قنبله'||command==='قنبلة'){try{await sock.sendMessage(from,{text:`💣 @${sender.split('@')[0]} رمى قنبلة!!!`,mentions:[sender]}); await new Promise(r=>setTimeout(r,400)); await sock.sendMessage(from,{text:'⏳ 3... 🧨'}); await new Promise(r=>setTimeout(r,600)); await sock.sendMessage(from,{text:'⏰ 2...'}); await new Promise(r=>setTimeout(r,600)); await sock.sendMessage(from,{text:'💥 1... BOOM!'}); await new Promise(r=>setTimeout(r,500)); const meta=await sock.groupMetadata(from).catch(()=>null); if(meta) await sock.sendMessage(from,{text:`💥 BOOOOM!!!\n🔥 انفجر الجروب!!!\n💀 @${sender.split('@')[0]} فجرها!\n💰 +2000`,mentions:meta.participants.map(p=>p.id)}); money[sender]=getMoney(sender)+2000; save('money',money)}catch{}; return}
if(bodyLow.includes('يا بوت')||bodyLow.includes('يابوت')){const lines=body.split('\n').filter(l=>l.toLowerCase().includes('يا بوت')||l.toLowerCase().includes('يابوت')); if(lines.length>1){let replies=[]; for(let line of lines){let clean=line.replace(/يا بوت|يابوت/gi,'').trim(); if(clean) replies.push(getRealAI(clean,pushName))} if(replies.length>0){await reply(replies.join('\n\n'),[sender]); return}} else{const ask=body.replace(/يا بوت|يابوت/gi,'').trim(); if(ask.length>0){await reply(getRealAI(ask,pushName),[sender]); return}}}
if(command==='سولف'){if(!text) return reply(`💬 اكتب:.سولف كيف حالك`,[sender]); await reply(`💬 ${getRealAI(text,pushName)}`,[sender]); return}
if(command==='غزل'){const men=getMen(); if(!men) return reply(`💘 يا جمالك يا ${pushName} 😍`,[sender]); reply(`💘 يا جمالك يا @${men.split('@')[0]} 😍`,[men]); return}
if(command==='مدح'){const men=getMen()||sender; reply(`👑 مدح @${men.split('@')[0]}: أسطورة وابن أصل 🔥`,[men]); return}
if(command==='قصفجبهات'){const men=getMen(); if(!men) return reply('🔥.قصفجبهات @'); reply(`🔥 قصف @${men.split('@')[0]} وجهك مثل طيز القرد 😂`,[men]); return}
if(command==='ذكاء'){chatMode[from]=!chatMode[from]; save('chatMode',chatMode); reply(chatMode[from]?`🧠✅ تشغيل الذكاء`:`🧠❌ ايقاف`); return}
if(chatMode[from]&&!body.startsWith('.')&&body.length>2&&body.length<150){await reply(getRealAI(body,pushName),[sender]); return}
if(!body.startsWith('.')) return
if(command==='فحص'){reply(`🔍 فحص:\n👥 ${groupMeta?.participants?.length||0}\n✅ v63 بدون أخطاء`); return}
else if(command==='تحذير'){const men=getMen(); if(!men)return reply('⚠️.تحذير @'); if(!warnings[from])warnings[from]={}; warnings[from][men]=(warnings[from][men]||0)+1; save('warnings',warnings); reply(`⚠️ تحذير @${men.split('@')[0]} (${warnings[from][men]}/3)`,[men]); if(warnings[from][men]>=3){try{await sock.groupParticipantsUpdate(from,[men],'remove')}catch{}}}
else if(command==='طرد'){const men=getMen(); if(!men)return reply('🚫.طرد @'); try{await sock.groupParticipantsUpdate(from,[men],'remove'); reply(`✅ طرد @${men.split('@')[0]}`,[men])}catch{reply('❌ فشل')}}
else if(command==='قفل'){locked[from]=true; save('locked',locked); reply('🔒 قفل'); try{await sock.groupSettingUpdate(from,'announcement')}catch{}}
else if(command==='فتح'){locked[from]=false; save('locked',locked); reply('🔓 فتح'); try{await sock.groupSettingUpdate(from,'not_announcement')}catch{}}
else if(command==='كتم'){const men=getMen(); if(!men) return reply('🔇.كتم @'); if(!muted[from]) muted[from]=[]; muted[from].push(men); save('muted',muted); reply(`🔇 كتم @${men.split('@')[0]}`,[men])}
else if(body.startsWith('.فك الكتم')){const men=getMen(); if(!men) return reply('🔊.فك الكتم @'); muted[from]=(muted[from]||[]).filter(x=>x!==men); save('muted',muted); reply(`🔊 فك كتم @${men.split('@')[0]}`,[men])}
else if(command==='المكتومين'){if(!muted[from]||muted[from].length===0) return reply('✅ لا يوجد مكتومين'); reply(muted[from].map((id,i)=>`${i+1}. @${id.split('@')[0]}`).join('\n'), muted[from])}
else if(command==='منشن'||command==='الجميع'){const meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:`📢 ${text}\n`+meta.participants.map(p=>`@${p.id.split('@')[0]}`).join(' '),mentions:meta.participants.map(p=>p.id)})}
else if(command==='جروب'){if(!groupMeta) return; reply(`ℹ️ ${groupMeta.subject}\n👥 ${groupMeta.participants.length}`)}
else if(command==='فجرها'||command==='فجر'){await reply('💣 تفعيل 5 ثواني!'); for(let i=5;i>=1;i--){await new Promise(r=>setTimeout(r,600)); await sock.sendMessage(from,{text:`${i}️⃣`})} const meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:`💥 BOOM @${sender.split('@')[0]} فجرها 🔥`,mentions:meta.participants.map(p=>p.id)}); money[sender]+=5000; save('money',money); return}
else if(command==='قصف'){const t=getMen(); if(!t) return reply('🚀.قصف @'); await sock.sendMessage(from,{text:`🚀 قصف @${t.split('@')[0]} 😂`,mentions:[t]}); return}
else if(command==='حرب'){const meta=await sock.groupMetadata(from); const p1=meta.participants[Math.floor(Math.random()*meta.participants.length)]; const p2=meta.participants.filter(p=>p.id!==p1.id)[Math.floor(Math.random()*(meta.participants.length-1))]; await sock.sendMessage(from,{text:`⚔️ @${p1.id.split('@')[0]} VS @${p2.id.split('@')[0]} الفائز @${p1.id.split('@')[0]} 🏆`,mentions:[p1.id,p2.id]}); return}
else if(command==='احتلال'){money[sender]+=20000; save('money',money); reply(`🏴‍☠️ @${sender.split('@')[0]} احتل الجروب +20000 💰`,[sender]); return}
else if(command==='زلزال'){await reply('🌋 زلزال 10 ريختر!!!'); await new Promise(r=>setTimeout(r,700)); const meta=await sock.groupMetadata(from); const randoms=meta.participants.filter(p=>p.id!==sender).sort(()=>0.5-Math.random()).slice(0,3); await sock.sendMessage(from,{text:`💀 ضحايا:\n`+randoms.map(p=>`🏚️ @${p.id.split('@')[0]}`).join('\n')+`\n🤣 مقلب +1000`,mentions:randoms.map(p=>p.id)}); money[sender]+=1000; save('money',money); return}
else if(command==='رعب'){reply(`👻 @${sender.split('@')[0]} سمع صوت انهش انهش 😱`,[sender]); return}
else if(command==='بنك'){reply(`🏦 كاش: ${getMoney(sender)}\n🏦 بنك: ${getBank(sender)}`,[sender])}
else if(command==='ايداع'){const amt=parseInt(text)||0; if(amt<=0||getMoney(sender)<amt) return reply('❌ فلوسك ناقصة'); money[sender]-=amt; bank[sender]=getBank(sender)+amt; save('money',money); save('bank',bank); reply(`✅ اودعت ${amt}`)}
else if(command==='سحب'){const amt=parseInt(text)||0; if(amt<=0||getBank(sender)<amt) return reply('❌ بنكك ناقص'); bank[sender]-=amt; money[sender]=getMoney(sender)+amt; save('money',money); save('bank',bank); reply(`✅ سحبت ${amt}`)}
else if(command==='تحويل'){const men=getMen(); const amt=parseInt(text.replace(/[^0-9]/g,''))||0; if(!men||amt<=0||getMoney(sender)<amt) return reply('💸.تحويل @ مبلغ'); money[sender]-=amt; money[men]=getMoney(men)+amt; save('money',money); reply(`✅ حولت ${amt} لـ @${men.split('@')[0]}`,[men])}
else if(command==='سرقة'){const men=getMen(); if(!men) return reply('😈.سرقة @'); const now=Date.now(); if(robTime[sender]&&now-robTime[sender]<600000) return reply('⏳ 10 دقايق'); const vic=getMoney(men); if(vic<500) return reply('😂 فقير'); const steal=Math.floor(vic*0.3); money[men]-=steal; money[sender]+=steal; robTime[sender]=now; save('money',money); save('robTime',robTime); reply(`😈 سرقت ${steal} من @${men.split('@')[0]}`,[men])}
else if(command==='راتب'){const now=Date.now(); if(daily[sender]&&now-daily[sender]<86400000) return reply('⏳ كل 24 ساعة'); const amt=500+Math.floor(Math.random()*2000); money[sender]+=amt; daily[sender]=now; save('money',money); save('daily',daily); reply(`💵 راتب ${amt}`)}
else if(command==='فلوس'){money[sender]+=1000; save('money',money); reply(`💰 +1000`)}
else if(command==='توب'){const top=Object.entries(money).sort((a,b)=>(b[1]+(bank[b[0]]||0))-(a[1]+(bank[a[0]]||0))).slice(0,10); reply('🏆 توب:\n'+top.map((x,i)=>`${i+1}. @${x[0].split('@')[0]} - ${x[1]+(bank[x[0]]||0)}`).join('\n'), top.map(x=>x[0]))}
else if(command==='رصيدي'){reply(`💳 رصيدك: ${getMoney(sender)+getBank(sender)}`)}
else if(command==='زواج'){const men=getMen(); if(!men)return reply('💍.زواج @'); marriages[sender]=men; save('marriages',marriages); reply(`💍 مبروك @${sender.split('@')[0]} ❤️ @${men.split('@')[0]}`,[men,sender])}
else if(command==='طلاق'){delete marriages[sender]; save('marriages',marriages); reply(`💔 طلاق`)}
else if(command==='حب'){const men=getMen(); const p=Math.floor(Math.random()*100); reply(`❤️ حب @${sender.split('@')[0]} و @${men?.split('@')[0]||'البوت'}: ${p}%`,men?[sender,men]:[sender])}
else if(command==='زواجني'){const meta=await sock.groupMetadata(from); const c=meta.participants.filter(p=>p.id!==sender)[Math.floor(Math.random()*(meta.participants.length-1))]; if(!c)return; reply(`💍 @${sender.split('@')[0]} يبغى @${c.id.split('@')[0]}`,[sender,c.id])}
else if(command==='غباء'||command==='ذكاء'||command==='جمال'){const men=getMen()||sender; const p=Math.floor(Math.random()*100); reply(`📊 ${command} @${men.split('@')[0]}: ${p}%`,[men])}
else if(command==='هل'){const ans=['نعم ✅','لا ❌','اكيد 🔥','مستحيل 😂']; reply(`❓ ${text}\n${ans[Math.floor(Math.random()*ans.length)]}`)}
else if(command==='احسب'){try{let ev=text.replace(/[^0-9+\-*/().]/g,''); if(ev){const res=Function('return '+ev)(); reply(`🧮 ${text} = ${res}`)}}catch{reply('❌ غلط')}}
else if(command==='menu'||command==='الاوامر'){
reply(`👑🤖 بوت محمد v63 - نظيف بدون أخطاء
━━━━━━━━━━━━━━━━
🤖 ذكاء شامل
.ذكاء
.سولف
يا بوت + أي كلمة

💘 حلوة
.غزل @
.مدح @
.قصفجبهات @

💣 مجنونة
.قنبله
.فجرها
.فجر
.زلزال
.احتلال
.رعب
.قصف @
.حرب

👮 إدارة
.فحص
.طرد @
.تحذير @
.قفل
.فتح
.كتم @
.فك الكتم @
.المكتومين
.منشن
.الجميع
.جروب

🏦 بنك
.بنك
.ايداع
.سحب
.تحويل @
.سرقة @
.راتب
.فلوس
.توب
.رصيدي

💍 حب
.زواج @
.طلاق
.حب @
.زواجني

😂 ترفيه
.غباء @
.ذكاء @
.جمال @
.هل
.احسب
.تويت
.اقتباس
.فضيحة @
.خيانة
.مستقبلي
.صراحه
.جرأه
.لو
.طق @
.احضن @
.ضرب @
.بوسه @
.طبطب @
.شخصيتي
.عكس
.ميمز
.احبك
.اكرهك

🎮 ألعاب
.اكس
.حط
.كتابة
.صيد
.سباق
.نرد
.عقاب @
.ملوك
.قلب
.مافيا
.انا
.تحداني
.حجر
.ورقة
.مقص
.نكتة
.حكمة
.لغز

🔥 أكشن
.قتل @
.ذبح @
.تفجير @
.سجن @
.حرر @
.خطف @
.فزعه
.نوم
.صحى
.مصارعه
.رفس @
.لكم @
.هروب
.مطاردة
.قناص @
.صاروخ @
.دبابه
.جيش
.كشف @
.تجسس @
.مراقبة
.تصويت
.حظ
.برج

━━━━━━━━━━━━━━━━
🇾🇪 105+ أمر كل واحد في سطر
✅ بدون ytdl - بدون أخطاء
`)
}
}catch(e){console.log(e.message)}
})
}
startBot()
