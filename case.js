const fs = require("fs");
const { NewMessage } = require("telegram/events/NewMessage");
const axios = require("axios");
const { CallbackQuery } = require("telegram/events/CallbackQuery");
const { Api } = require("telegram");
const FormData = require("form-data");
const archiver = require("archiver");
const config = require("./config");
const path = require("path");
const { CustomFile } = require("telegram/client/uploads");
const { Client: SSHClient } = require("ssh2");
const https = require("https");
const http = require("http");

const BL_FILE = path.join(__dirname, "blacklist.json");
const SL_FILE = path.join(__dirname, "sellerlist.json"); 

if (!fs.existsSync(BL_FILE)) fs.writeFileSync(BL_FILE, JSON.stringify([]));
if (!fs.existsSync(SL_FILE)) fs.writeFileSync(SL_FILE, JSON.stringify([]));

function loadBlacklist() {
  try {
    return JSON.parse(fs.readFileSync(BL_FILE));
  } catch {
    return [];
  }
}

function saveBlacklist(list) {
  fs.writeFileSync(BL_FILE, JSON.stringify(list, null, 2));
}

function loadSellerList() {
  try {
    return JSON.parse(fs.readFileSync(SL_FILE));
  } catch {
    return [];
  }
}

function saveSellerList(list) {
  fs.writeFileSync(SL_FILE, JSON.stringify(list, null, 2));
}

let ttHandlerRegistered = false;

const downloadToTemp = (url, ext) => new Promise((resolve, reject) => {
  const tmpPath = path.join(__dirname, "tmp", `file_${Date.now()}.${ext}`);
  if (!fs.existsSync(path.join(__dirname, "tmp"))) {
    fs.mkdirSync(path.join(__dirname, "tmp"));
  }
  const proto = url.startsWith("https") ? https : http;
  const file = fs.createWriteStream(tmpPath);
  proto.get(url, { headers: { "user-agent": "TelegramBot (like TwitterBot)" } }, res => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      return downloadToTemp(res.headers.location, ext).then(resolve).catch(reject);
    }
    res.pipe(file);
    file.on("finish", () => { file.close(); resolve(tmpPath); });
  }).on("error", reject);
});

module.exports = async (client, msg) => {

  // ✅ Handler TikTok di dalam module.exports
if (!ttHandlerRegistered) {
  ttHandlerRegistered = true;
  client.addEventHandler(async (event) => {
    const query = event;
    if (!query.data) return;

    const data = query.data ? query.data.toString() : "";    if (!data.startsWith("tt|")) return;

    const [, action, ...rest] = data.split("|");
    const url = rest.join("|");

    try {
      if (action === "vid") {
        await client.answerCallbackQuery(query.id, { message: "⏳ Mengunduh video..." });
        const res = await fetchJson(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`);
        const videoUrl = res?.data?.play || res?.data?.video;
        if (!videoUrl) throw new Error("Video tidak ditemukan");
        await client.sendFile(query.chatId, { file: videoUrl, caption: "🎬 Video TikTok" });
      }

      else if (action === "foto") {
        await client.answerCallbackQuery(query.id, { message: "⏳ Mengunduh foto..." });
        const res = await fetchJson(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`);
        const images = res?.data?.images || [];
        if (images.length === 0) throw new Error("Foto tidak ditemukan");
        for (const img of images) {
          await client.sendFile(query.chatId, { file: img, caption: "🖼️ Foto TikTok" });
        }
      }

      else if (action === "sound") {
        await client.answerCallbackQuery(query.id, { message: "⏳ Mengunduh sound..." });
        const res = await fetchJson(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`);
        const soundUrl = res?.data?.music;
        if (!soundUrl) throw new Error("Sound tidak ditemukan");
        await client.sendFile(query.chatId, { file: soundUrl, caption: "🎵 Sound TikTok" });
      }

    } catch (e) {
      await client.answerCallbackQuery(query.id, { message: `Error: ${e.message}`, alert: true }).catch(() => {});
    }

  }, new CallbackQuery({}));
}
  // ✅ Lanjut kode kamu seperti biasa di bawah sini

try {
let sellerList = loadSellerList(); 
let blacklist = loadBlacklist();
const isCmd = msg.message?.startsWith(global.prefix);
const args = msg.message.trim().split(/ +/).slice(1);
const argText = text = args.join(" ");
const command = isCmd ? msg.message.slice(global.prefix.length).trim().split(" ").shift().toLowerCase() : "";
const cmd = global.prefix + command;
const chatId = msg.chatId;
const me = await client.getMe();
const up = runtime(process.uptime());
const isSeller = sellerList.includes(msg.senderId.toString())
const isOwner =
  msg.senderId?.toString() === global.ownerID?.toString() ||
  msg.senderId?.toString() === me.id.toString();
  
if (global.modeSelf && !isOwner) return

const reply = async (message, options = {}) => {
  try {
    const payload = {
      message,
      replyTo: msg.id,
      parseMode: "html",
      linkPreview: false,
      ...options,
    };
    return await client.sendMessage(options.jid ? options.jid : msg.chatId, payload);
  } catch (err) {
    console.error("Reply error:", err?.message || err);
  }
};

const messOwner = () => reply("⚠️ Hanya Owner/User premium yang bisa menggunakan perintah ini!");
const messGroup = () => reply("⚠️ Perintah ini hanya bisa dijalankan di dalam grup.");

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

switch (command) {

case "menu": case "help": case "start": {
const sender = await client.getEntity(msg.senderId);
const menu = `
<blockquote>
<a style="text-decoration: none;" href="t.me/${global.ownerUsername}">ᴄʀᴇᴀᴛᴇᴅ ʙʏ ᴅɪᴋᴀ</a>

╔╗╔╦══╦═╦═╗╔══╦═╦══╗
║║║║══╣╦╣╬║║╔╗║║╠╗╔╝
║╚╝╠══║╩╣╗╣║╔╗║║║║║─
╚══╩══╩═╩╩╝╚══╩═╝╚╝─

❏ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙎𝙄 𝘽𝙊𝙏 ❏
┆➩ ᴍᴏᴅᴇ  : ${global.modeSelf ? "self" : "public"}
┆➩ ᴜᴘᴛɪᴍᴇ : ${up}
┆➩ ᴏᴡɴᴇʀ  : ${global.ownerUsername}
┆➩ ᴠᴇʀsɪᴏɴ : 2.0
┆➩ ᴘʀᴇғɪx  : ${global.prefix} 
███████████████
❏ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙎𝙄 𝙐𝙎𝙀𝙍 ❏
┆➩ ᴜsᴇʀ ɪᴅ   : <code>${sender.id}</code>
┆➩ ᴜsᴇʀɴᴀᴍᴇ : @${sender.username || "-"}
┆➩ ɴᴀᴍᴀ     : <b>${sender.firstName || ""} ${sender.lastName || ""}</b>
┆➩ ᴘʀᴇᴍɪᴜᴍ  : ${sender.premium ? "Ya" : "Tidak"}
┆➩ 
███████████████‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎
╔══════════════════════╗
    𓆏 ＬＩＳＴ ＭＥＮＵ 𓆏  
╠══════════════════════╣
║📁 ＯＷＮＥＲ ＭＥＮＵ
║✐.ᴄғᴅ
║✐.ʙᴄ
║✐.ʟɪsᴛ  
║✐.ʙʟ
║✐.ᴅᴇʟʙʟ
║✐.ʟɪsᴛʙʟ
║✐.ʀᴇsᴇᴛʙʟ
║✐.ᴘᴜsʜᴋᴏɴᴛᴀᴋ
║✐.ᴘʀᴏsᴇs / .ᴅᴏɴe
║✐.ʙᴀᴄᴋᴜᴘ
║✐.ᴇᴠᴀʟ
║✐.ᴘᴀʏ 
║✐.ᴀᴅᴅᴄᴀsᴇ
║✐.ᴅᴇʟᴄᴀsᴇ
║
║📁 ＡＩ ＭＥＮＵ
║✐.ᴋɪᴍɪ
║✐.ᴀɪ
║✐.ɢᴘᴛ
║✐.ɢᴇᴍɪɴɪ
║✐.ɢʀᴏᴋ
║✐.ɴsғᴡᴀɪ
║✐.ᴀɪɪsʟᴀᴍ
║
║𝗸𝗲𝘁𝗶𝗸 .𝗺𝗲𝗻𝘂𝟭 𝘂𝗻𝘁𝘂𝗸 𝗺𝗲𝗹𝗶𝗵𝗮𝘁
║𝗺𝗲𝗻𝘂 𝗹𝗮𝗶𝗻𝗻𝗻𝘆𝗮. 
║📦
║.𝗺𝗲𝗻𝘂𝟭
║.𝗺𝗲𝗻𝘂𝟮
║.𝗺𝗲𝗻𝘂𝟯
╚══════════════════════╝


</blockquote> 
`;
    await client.sendFile(msg.chatId, {
        file: global.thumbnail,
        caption: menu,
        replyTo: msg.id,
        parseMode: "html",  
});
}
break;

case "menu1": case "help1": case "start1": {
const sender = await client.getEntity(msg.senderId);
const menu = `
<blockquote>
<a style="text-decoration: none;" href="𝗺𝗲𝗻𝗮𝗺𝗽𝗶𝗹𝗸𝗮𝗻 𝗺𝗲𝗻𝘂𝟭">ᴄʀᴇᴀᴛᴇᴅ ʙʏ ᴅɪᴋᴀ</a>

╔╗╔╦══╦═╦═╗╔══╦═╦══╗
║║║║══╣╦╣╬║║╔╗║║╠╗╔╝
║╚╝╠══║╩╣╗╣║╔╗║║║║║─
╚══╩══╩═╩╩╝╚══╩═╝╚╝─

❏ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙎𝙄 𝘽𝙊𝙏 ❏
┆➩ ᴍᴏᴅᴇ  : ${global.modeSelf ? "self" : "public"}
┆➩ ᴜᴘᴛɪᴍᴇ : ${up}
┆➩ ᴏᴡɴᴇʀ  : ${global.ownerUsername}
┆➩ ᴠᴇʀsɪᴏɴ : 2.0
┆➩ ᴘʀᴇғɪx  : ${global.prefix} 
███████████████
❏ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙎𝙄 𝙐𝙎𝙀𝙍 ❏
┆➩ ᴜsᴇʀ ɪᴅ   : <code>${sender.id}</code>
┆➩ ᴜsᴇʀɴᴀᴍᴇ : @${sender.username || "-"}
┆➩ ɴᴀᴍᴀ     : <b>${sender.firstName || ""} ${sender.lastName || ""}</b>
┆➩ ᴘʀᴇᴍɪᴜᴍ  : ${sender.premium ? "Ya" : "Tidak"}
┆➩ 
███████████████‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎
╔══════════════════════╗
    𓆏 ＬＩＳＴ ＭＥＮＵ 𓆏  
╠══════════════════════╣
║📁 ＤＯＷＮＬＯＡＤ ＭＥＮＵ
║✐.ᴛɪᴋᴛᴏᴋ / .ʏᴛ
║✐.ɪɴsᴛᴀɢʀᴀᴍ / .ɪɢ
║✐.ғᴀᴄᴇᴇʙᴏᴏᴋ / .ғʙ
║✐.ᴍᴇᴅɪᴀғɪʀᴇ / .ᴍғ
║✐.ɢɪᴛʜᴜʙ / .ɢʜ
║✐.ʏᴏᴜᴛᴜʙᴇ / .ʏᴛᴅʟ
║✐.sᴘᴏʀɪғʏ
║✐
║
║📁 ＦＵＮ ＭＥＮＵ
║✐.ᴡᴀɪғᴜ 
║✐.ᴄᴏsᴘʟᴀʏ
║✐.ʜᴇʀᴏᴍʟ
║✐.ɴsғᴡ 
║
╚══════════════════════╝
/blockquote> 
`;
    await client.sendFile(msg.chatId, {
        file: global.thumbnail,
        caption: menu,
        replyTo: msg.id,
        parseMode: "html",  
});
}
break;

case "menu2": case "help2": case "start2": {
const sender = await client.getEntity(msg.senderId);
const menu = `
<blockquote>
<a style="text-decoration: none;" href="𝗺𝗲𝗻𝗮𝗺𝗽𝗶𝗹𝗸𝗮𝗻 𝗺𝗲𝗻𝘂𝟮">𝗺𝗲𝗻𝗮𝗺𝗽𝗶𝗹𝗸𝗮𝗻 𝗺𝗲𝗻𝘂𝟮</a>

╔╗╔╦══╦═╦═╗╔══╦═╦══╗
║║║║══╣╦╣╬║║╔╗║║╠╗╔╝
║╚╝╠══║╩╣╗╣║╔╗║║║║║─
╚══╩══╩═╩╩╝╚══╩═╝╚╝─

❏ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙎𝙄 𝘽𝙊𝙏 ❏
┆➩ ᴍᴏᴅᴇ  : ${global.modeSelf ? "self" : "public"}
┆➩ ᴜᴘᴛɪᴍᴇ : ${up}
┆➩ ᴏᴡɴᴇʀ  : ${global.ownerUsername}
┆➩ ᴠᴇʀsɪᴏɴ : 2.0
┆➩ ᴘʀᴇғɪx  : ${global.prefix} 
███████████████
❏ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙎𝙄 𝙐𝙎𝙀𝙍 ❏
┆➩ ᴜsᴇʀ ɪᴅ   : <code>${sender.id}</code>
┆➩ ᴜsᴇʀɴᴀᴍᴇ : @${sender.username || "-"}
┆➩ ɴᴀᴍᴀ     : <b>${sender.firstName || ""} ${sender.lastName || ""}</b>
┆➩ ᴘʀᴇᴍɪᴜᴍ  : ${sender.premium ? "Ya" : "Tidak"}
┆➩ 
███████████████‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎
╔══════════════════════╗
    𓆏 ＬＩＳＴ ＭＥＮＵ 𓆏  
╠══════════════════════╣
║
║📁 ＰＡＮＥＬ ＭＥＮＵ
║✐.1ɢʙ - ᴜɴʟɪ
║✐.ʟɪsᴛᴘᴀɴᴇʟ
║✐.ᴅᴇʟᴘᴀɴᴇʟ
║✐.ᴄᴀᴅᴘ
║✐.ʟɪsᴛᴀᴅᴍɪɴ
║✐.ᴅᴇʟᴀᴅᴍɪɴ
║✐.ᴀᴅᴅsᴇʟʟᴇʀ
║✐.ʟɪsᴛsᴇʟʟᴇʀ
║✐.ʀᴇsᴇᴛsᴇʟʟᴇʀ
║✐.ᴅᴇʟsᴇʟʟᴇʀ
║✐.ɪɴsᴛᴀʟʟᴘᴀɴᴇʟ
║✐.sᴜʙᴅᴏᴍᴀɪɴ
║
║📁 ＳＥＡＲＣＨ ＭＥＮＵ
║✐.ɴᴘᴍsᴇᴀʀᴄʜ / .ɴᴘᴍ
║✐.ʏᴛsᴇᴀʀᴄʜ / .ʏᴛs
║✐.ᴀᴘᴘʟᴇᴍᴜsɪᴄ / .ᴀᴘᴍ
║✐.sᴏᴜɴᴅᴄʟᴏᴜᴅ / .sᴅᴄ
║✐.ᴛɪᴋᴛᴏᴋsᴇᴀʀᴄʜ / .ᴛᴛs
║✐.ɢᴏᴏɢʟᴇ
║✐.ʙsᴛᴀɪᴛɪᴏɴ / .ʙs
║✐.ᴘʟᴀʏsᴛᴏʀᴇ / .ᴘs
║✐.ᴘɪɴᴛᴇʀᴇsᴛ / .ᴘɪɴ
║✐
║
║
║
║
║
║
║
╚══════════════════════╝
</blockquote> 
`;
    await client.sendFile(msg.chatId, {
        file: global.thumbnail,
        caption: menu,
        replyTo: msg.id,
        parseMode: "html",  
});
}
break;

case "aiislam":
case "islamai": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.ai &lt;pertanyaan&gt;\n\nContoh:\n.aiislam apa itu islam`,
      parseMode: "html"
    });
    break;
  }

  const question = text.trim();
  await msg.reply({ message: "⏳ Menunggu jawaban AI..." });

  try {
    const res = await fetchJson(
      `https://api.nexray.web.id/ai/muslim?text=${encodeURIComponent(question)}`
    );

    const reply = res?.result;
    if (!reply) throw new Error("Tidak ada respons dari AI");

    // Potong jika terlalu panjang
    const maxLen = 4000;
    if (reply.length > maxLen) {
      const chunks = reply.match(/.{1,4000}/gs);
      for (const chunk of chunks) {
        await msg.reply({ message: chunk });
        await new Promise(r => setTimeout(r, 300));
      }
    } else {
      await msg.reply({ message: reply });
    }

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "ai": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `<blockquote>
    📌 <b>Penggunaan Command</b>\n\n.ai &lt;pertanyaan&gt;\n\nContoh:\n.ai apa itu java script?
    </blockquote>
    `,
      parseMode: "html"
    });
    break;
  }

  const question = text.trim();
  await msg.reply({ message: "⏳ Menunggu jawaban AI..." });

  try {
    const res = await fetchJson(
      `https://api.nexray.web.id/ai/gpt-3.5-turbo?text=${encodeURIComponent(question)}`
    );

    const reply = res?.result;
    if (!reply) throw new Error("Tidak ada respons dari AI");

    // Potong jika terlalu panjang
    const maxLen = 4000;
    if (reply.length > maxLen) {
      const chunks = reply.match(/.{1,4000}/gs);
      for (const chunk of chunks) {
        await msg.reply({ message: chunk });
        await new Promise(r => setTimeout(r, 300));
      }
    } else {
      await msg.reply({ message: reply });
    }

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "ait": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `<blockquote>
📌 <b>Penggunaan Command</b>

.ai &lt;pertanyaan&gt;

Contoh:
.ai apa itu java script?
</blockquote>`,
      parseMode: "html"
    });
    break;
  }

  const question = text.trim();
  await msg.reply({ message: "⏳ Menunggu jawaban AI..." });

  try {
    const res = await fetchJson(
      `https://api.nexray.web.id/ai/gpt-3.5-turbo?text=${encodeURIComponent(question)}`
    );

    const reply = res?.result;
    if (!reply) throw new Error("Tidak ada respons dari AI");

    // Potong jika terlalu panjang
    const maxLen = 3800; // Dikurangi sedikit untuk space blockquote
    if (reply.length > maxLen) {
      const chunks = reply.match(/.{1,3800}/gs);
      for (const chunk of chunks) {
        await msg.reply({ 
          message: `<blockquote>${escapeHtml(chunk)}</blockquote>`,
          parseMode: "html" 
        });
        await new Promise(r => setTimeout(r, 300));
      }
    } else {
      await msg.reply({ 
        message: `<blockquote>${escapeHtml(reply)}</blockquote>`,
        parseMode: "html" 
      });
    }

  } catch (e) {
    await msg.reply({ 
      message: `<blockquote>❌ Error: ${escapeHtml(e.message)}</blockquote>`,
      parseMode: "html" 
    });
  }

  break;
}

case "chatgpt":
case "gpt": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.gpt &lt;pertanyaan&gt;\n\nContoh:\n.gpt apa itu javascript?`,
      parseMode: "html"
    });
    break;
  }

  const question = text.trim();
  await msg.reply({ message: "⏳ Menunggu jawaban ChatGPT..." });

  try {
    const res = await fetchJson(
      `https://skyzopedia-api2.vercel.app/ai/gpt?apikey=skyy&question=${encodeURIComponent(question)}`
    );

    const reply = res?.result;
    if (!reply) throw new Error("Tidak ada respons dari AI");

    // Potong jika terlalu panjang
    const maxLen = 4000;
    if (reply.length > maxLen) {
      const chunks = reply.match(/.{1,4000}/gs);
      for (const chunk of chunks) {
        await client.sendMessage(chatId, { message: chunk });
        await new Promise(r => setTimeout(r, 300));
      }
    } else {
      await client.sendMessage(chatId, { message: reply });
    }

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}
case "gemini": {
  const talk = text?.trim() || "hai";
  try {
    const res = await fetchJson(
      `https://api.juun4.cloud/ai/gemini?text=${encodeURIComponent(talk)}&apikey=free`
    );

    // Cek dulu apakah res.result ada isinya
    const reply = res?.result?.text || "Tidak ada respons dari AI.";    
    
    await client.sendMessage(chatId, { message: reply });
  } catch (e) {
    await client.sendMessage(chatId, { message: `Error: ${e.message || e.toString()}` });
  }
  break;
}

case "kimi": {
    try {
        const sender = await client.getEntity(msg.senderId);

        // Ambil input dari pengguna (misal pesan setelah perintah)
        const userText = msg.text.replace(/^\/kimi\s*/i, "") || "Halo";

        // Panggil API Kimi AI
        const response = await fetch(`https://api.nexray.web.id/ai/kimi?text=${encodeURIComponent(userText)}`);
        const data = await response.json();

        if (data.status) {
            const kimiResult = data.result;

            const menuKimi = `
<blockquote>
<b>🤖 Kimi AI Menu</b>

Hai <b>${sender.firstName || ""}</b>! Ini hasil dari Kimi AI:

${kimiResult}

<i>Author: ${data.author}</i>
<i>Response time: ${data.response_time}</i>
</blockquote>
`;

            await client.sendMessage(msg.chatId, {
                message: menuKimi,
                replyTo: msg.id,
                parseMode: "html"
            });
        } else {
            await client.sendMessage(msg.chatId, {
                message: "Maaf, Kimi AI sedang tidak bisa merespons saat ini.",
                replyTo: msg.id
            });
        }
    } catch (err) {
        console.error(err);
        await client.sendMessage(msg.chatId, {
            message: "Terjadi kesalahan saat memanggil Kimi AI.",
            replyTo: msg.id
        });
    }
}
break;

case "pinterest":
case "pin": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.pin &lt;keyword&gt;\n\nContoh:\n.pin dasha taran`,
      parseMode: "html"
    });
    break;
  }

  const query = text.trim();
  await msg.reply({ message: "⏳ Mencari di Pinterest..." });

  try {
    const res = await fetchJson(
      `https://api.nexray.web.id/search/pinterest?q=${encodeURIComponent(query)}`
    );

    const result = res?.result;
    if (!result || result.length === 0) throw new Error("Tidak ada hasil ditemukan");

    // Ambil 5 gambar pertama
    const top5 = result.slice(0, 5);

    await msg.reply({
      message: `📌 <b>Pinterest Search</b>\n🔍 Keyword: <b>${query}</b>\n🖼️ Mengirim ${top5.length} gambar...`,
      parseMode: "html"
    });

    for (let i = 0; i < top5.length; i++) {
      const item = top5[i];
      const imgUrl = item.images_url;
      const title = item.grid_title || item.seo_alt_text?.slice(0, 50) || "Pinterest";
      const pinUrl = item.pin;

      if (!imgUrl) continue;

      await client.sendFile(chatId, {
        file: imgUrl,
        caption: `🖼️ <b>${i + 1}/${top5.length}</b>\n📝 ${title}\n🔗 <a href="${pinUrl}">Lihat di Pinterest</a>`,
        parseMode: "html"
      });

      await new Promise(r => setTimeout(r, 500));
    }

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "tiktok":
case "tt": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.tt &lt;link&gt;\n\nContoh:\n.tt https://vt.tiktok.com/xxx`,
      parseMode: "html"
    });
    break;
  }

  const ttUrl = text.trim();
  await msg.reply({ message: "⏳ Mengambil info TikTok..." });

  try {
    const ttRes = await fetchJson(
      `https://api.juun4.cloud/download/tiktok?url=${encodeURIComponent(ttUrl)}&apikey=free`
    );

    const ttResult = ttRes?.result;
    if (!ttResult) throw new Error("Gagal mengambil data");

    const ttTitle = ttResult.title || "TikTok Video";
    const ttViews = ttResult.stats?.views || "0";
    const ttLikes = ttResult.stats?.likes || "0";
    const ttAuthor = ttResult.author?.fullname || "Unknown";
    const ttDuration = ttResult.duration || "";
    const ttVideoUrl = ttResult.data?.find(d => d.type === "nowatermark")?.url || null;
    const ttPhotos = ttResult.data?.filter(d => d.type === "photo") || [];
    const ttMusicUrl = ttResult.music_info?.url || null;

    if (ttVideoUrl) {
      await client.sendFile(chatId, {
        file: ttVideoUrl,
        caption: `🎵 <b>TikTok Info</b>\n\n👤 <b>Author:</b> ${ttAuthor}\n📝 <b>Title:</b> ${ttTitle}\n⏱ <b>Durasi:</b> ${ttDuration}\n👁 <b>Views:</b> ${ttViews}\n❤️ <b>Likes:</b> ${ttLikes}`,
        parseMode: "html"
      });
      if (ttMusicUrl) {
        await client.sendFile(chatId, {
          file: ttMusicUrl,
          caption: `🎵 ${ttResult.music_info?.title || "Sound TikTok"}`
        });
      }
    } else if (ttPhotos.length > 0) {
      for (let i = 0; i < ttPhotos.length; i++) {
        await client.sendFile(chatId, {
          file: ttPhotos[i].url,
          caption: i === 0
            ? `📸 Foto ${i + 1}/${ttPhotos.length}` : ``
            });
            }
     // Kirim musik setelah foto
  if (ttMusicUrl) {
    await client.sendFile(chatId, {
      file: ttMusicUrl,
      caption: `🎵 ${ttResult.music_info?.title || "Sound TikTok"}`
    });
  }
  
    } else {
      throw new Error("Konten tidak ditemukan");
    }

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "instagram":
case "ig": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.ig &lt;link&gt;\n\nContoh:\n.ig https://www.instagram.com/p/xxx`,
      parseMode: "html"
    });
    break;
  }

  const igUrl = text.trim();
  await msg.reply({ message: "⏳ Mengambil konten Instagram..." });

  try {
    const igRes = await fetchJson(
      `https://skyzopedia-api2.vercel.app/download/instagram?apikey=skyy&url=${encodeURIComponent(igUrl)}`
    );

    const igResult = igRes?.result;
    if (!igResult || igResult.length === 0) throw new Error("Gagal mengambil data");

    await msg.reply({
      message: `✅ <b>Instagram Downloader</b>\n📦 Ditemukan ${igResult.length} file\n⏳ Mengirim semua...`,
      parseMode: "html"
    });
for (let i = 0; i < igResult.length; i++) {
  const item = igResult[i];
  const dlUrl = item.url_download;
  const kualitas = item.kualitas || "File";
  if (!dlUrl) continue;

  // Tentukan ekstensi
  const isVideo = kualitas.toLowerCase().includes("video");
  const ext = isVideo ? "mp4" : "jpg";

  const tmpPath = await downloadToTemp(dlUrl, ext);
  await client.sendFile(chatId, {
    file: tmpPath,
    caption: `📥 ${kualitas} ${i + 1}/${igResult.length}`
  });
  fs.unlinkSync(tmpPath);

  await new Promise(r => setTimeout(r, 500));
    }

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "applemusic":
case "apm": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.apm &lt;keyword&gt;\n\nContoh:\n.apm bergema sampai selamanya`,
      parseMode: "html"
    });
    break;
  }

  const apmQuery = text.trim();
  await msg.reply({ message: "⏳ Mencari di Apple Music..." });

  try {
    const apmRes = await fetchJson(
      `https://api.nexray.web.id/search/applemusic?q=${encodeURIComponent(apmQuery)}`
    );

    const apmResults = apmRes?.result;
    if (!apmResults || apmResults.length === 0) throw new Error("Tidak ada hasil ditemukan");

    // Filter hanya Song
    const apmSongs = apmResults.filter(r => r.subtitle?.includes("Song"));
    if (apmSongs.length === 0) throw new Error("Tidak ada lagu ditemukan");

    // Ambil random 1 lagu
    const apmRandom = apmSongs[Math.floor(Math.random() * apmSongs.length)];
    const apmTitle = apmRandom.title;
    const apmArtist = apmRandom.subtitle?.replace("Song · ", "") || "";
    const apmCover = apmRandom.image;

    await msg.reply({
      message: `🎵 <b>Apple Music</b>\n\n🎶 <b>${apmTitle}</b>\n👤 ${apmArtist}\n⏳ Mengunduh audio...`,
      parseMode: "html"
    });

    // Download via YouTube
    const apmYt = await fetchJson(
      `https://api.juun4.cloud/search/youtube?query=${encodeURIComponent(apmTitle + " " + apmArtist)}&apikey=free`
    );

    const apmVideo = apmYt?.result?.videos?.[0];
    if (!apmVideo) throw new Error("Lagu tidak ditemukan");

    const apmDl = await fetchJson(
      `https://api.danzy.web.id/api/download/ytmp3?url=${encodeURIComponent(apmVideo.url)}`
    );

    const apmAudioUrl = apmDl?.data?.downloadUrl;
    if (!apmAudioUrl) throw new Error("Gagal download audio");

    // Kirim cover
    if (apmCover) {
      await client.sendFile(chatId, {
        file: apmCover,
        caption: `🎵 <b>${apmTitle}</b>\n👤 ${apmArtist}`,
        parseMode: "html"
      });
    }

    // Kirim audio
    const apmTmp = await downloadToTemp(apmAudioUrl, "mp3");
    await client.sendFile(chatId, {
      file: apmTmp,
      caption: `🎵 <b>${apmTitle}</b>\n👤 ${apmArtist}`,
      parseMode: "html"
    });
    fs.unlinkSync(apmTmp);

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "soundcloud":
case "scd": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.sc &lt;keyword&gt;\n\nContoh:\n.sc bahagia lagi`,
      parseMode: "html"
    });
    break;
  }

  const scQuery = text.trim();
  await msg.reply({ message: "⏳ Mencari di SoundCloud..." });

  try {
    // Search SoundCloud
    const scSearch = await fetchJson(
      `https://api.nexray.web.id/search/soundcloud?q=${encodeURIComponent(scQuery)}`
    );

    const scResults = scSearch?.result;
    if (!scResults || scResults.length === 0) throw new Error("Tidak ada hasil ditemukan");

    // Ambil hasil pertama
    const scSong = scResults[0];
    const scTitle = scSong.title;
    const scAuthor = scSong.author?.name || "Unknown";
    const scThumb = scSong.thumbnail;
    const scDuration = scSong.duration;
    const scPlays = scSong.play_count;
    const scLikes = scSong.like_count;

    await msg.reply({
      message: `🎵 <b>SoundCloud</b>\n\n🎶 <b>${scTitle}</b>\n👤 ${scAuthor}\n⏱ ${scDuration}\n👁 ${scPlays} plays | ❤️ ${scLikes}\n\n⏳ Mengunduh audio...`,
      parseMode: "html"
    });

    // Download audio
    const scDl = await fetchJson(
      `https://api.nexray.web.id/downloader/soundcloud?url=${encodeURIComponent(scSong.url)}`
    );

    const scAudioUrl = scDl?.result?.url;
    if (!scAudioUrl) throw new Error("Gagal download audio");

    // Kirim thumbnail
    if (scThumb) {
      await client.sendFile(chatId, {
        file: scThumb,
        caption: `🎵 <b>${scTitle}</b>\n👤 ${scAuthor}`,
        parseMode: "html"
      });
    }

    // Kirim audio
    const scTmp = await downloadToTemp(scAudioUrl, "mp3");
    await client.sendFile(chatId, {
      file: scTmp,
      caption: `🎵 <b>${scTitle}</b>\n👤 ${scAuthor}\n⏱ ${scDuration}`,
      parseMode: "html"
    });
    fs.unlinkSync(scTmp);

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "github":
case "gh": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.gh &lt;link repo&gt;\n\nContoh:\n.gh https://github.com/username/repo`,
      parseMode: "html"
    });
    break;
  }

  const ghUrl = text.trim();
  await msg.reply({ message: "⏳ Mengambil repo GitHub..." });

  try {
    const ghRes = await fetchJson(
      `https://skyzopedia-api2.vercel.app/download/github?apikey=skyy&url=${encodeURIComponent(ghUrl)}`
    );

    const ghResult = ghRes?.result;
    if (!ghResult) throw new Error("Gagal mengambil data");

    const dlUrl = ghResult.download;
    const filename = ghResult.filename;

    if (!dlUrl) throw new Error("Link download tidak ditemukan");

    const tmpPath = await downloadToTemp(dlUrl, "zip");
    await client.sendFile(chatId, {
      file: tmpPath,
      caption: `📦 <b>GitHub Downloader</b>\n\n📁 <b>File:</b> ${filename}`,
      parseMode: "html"
    });
    fs.unlinkSync(tmpPath);

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "spotify":
case "spot": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.spot &lt;link&gt;\n\nContoh:\n.spot https://open.spotify.com/track/xxx`,
      parseMode: "html"
    });
    break;
  }

  const spotUrl = text.trim();
  await msg.reply({ message: "⏳ Mengunduh dari Spotify..." });

  try {
    const spotRes = await fetchJson(
      `https://skyzopedia-api2.vercel.app/download/spotify?apikey=skyy&url=${encodeURIComponent(spotUrl)}`
    );

    const spotResult = spotRes?.result;
    if (!spotResult) throw new Error("Gagal mengambil data");

    const dlUrl = spotResult.download_url;
    if (!dlUrl) throw new Error("Link download tidak ditemukan");

    const tmpPath = await downloadToTemp(dlUrl, "mp3");
await client.sendFile(chatId, {
  file: tmpPath,
  caption: `🎵 <b>Spotify Downloader</b>`,
  parseMode: "html",
  attributes: [
    new Api.DocumentAttributeAudio({
      duration: 0,
      title: "Spotify Audio",
      performer: "Unknown"
    })
  ]
});
fs.unlinkSync(tmpPath);

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "waifu": {
  await msg.reply({ message: "⏳ Mengambil waifu..." });

  try {
    const waifuUrl = `https://skyzopedia-api2.vercel.app/random/waifu?apikey=skyy&_=${Date.now()}`;

    await client.sendFile(chatId, {
      file: waifuUrl,
      caption: `🌸 <b>Random Waifu</b>`,
      parseMode: "html"
    });

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "nsfw": {
if (!isOwner && !isSeller) return messOwner()
  await msg.reply({ message: "⏳ Mengambil nsfw..." });

  try {
    const waifuUrl = `https://skyzopedia-api2.vercel.app/random/nsfw?apikey=skyy&_=${Date.now()}`;

    await client.sendFile(chatId, {
      file: waifuUrl,
      caption: `🌸 <b>Random Nsfw</b>`,
      parseMode: "html"
    });

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "cosplay": {
  await msg.reply({ message: "⏳ Mengambil cosplay..." });

  try {
    const waifuUrl = `https://skyzopedia-api2.vercel.app/random/cosplay?apikey=skyy&_=${Date.now()}`;

    await client.sendFile(chatId, {
      file: waifuUrl,
      caption: `🌸 <b>Random Cosplay</b>`,
      parseMode: "html"
    });

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "heroml":
case "hero": {
  await msg.reply({ message: "⏳ Mengambil hero Mobile Legends..." });

  try {
    const heroRes = await fetchJson(
      `https://skyzopedia-api2.vercel.app/random/heroml?apikey=skyy`
    );

    const hero = heroRes?.hero;
    const audioUrl = heroRes?.audio;

    if (!hero) throw new Error("Gagal mengambil data");

    await msg.reply({
      message: `⚔️ <b>Random Hero ML</b>\n\n🦸 <b>Hero:</b> ${hero}`,
      parseMode: "html"
    });

    if (audioUrl) {
      const tmpPath = await downloadToTemp(audioUrl, "ogg");
      await client.sendFile(chatId, {
        file: tmpPath,
        caption: `🔊 Voice: ${hero}`
      });
      fs.unlinkSync(tmpPath);
    }

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "bing":
case "bingsearch": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.bing &lt;keyword&gt;\n\nContoh:\n.bing siapa presiden pertama indonesia`,
      parseMode: "html"
    });
    break;
  }

  const query = text.trim();
  await msg.reply({ message: "⏳ Mencari di Bing..." });

  try {
    const res = await fetchJson(
      `https://api.danzy.web.id/api/search/bing?q=${encodeURIComponent(query)}`
    );

    const result = res?.result;
    if (!result) throw new Error("Gagal mengambil data");

    const images = result.images || [];
    const videos = result.videos || [];

    let txt = `🔍 <b>Bing Search</b>\n🔎 <b>Keyword:</b> ${query}\n\n`;

    if (images.length > 0) {
      txt += `🖼️ <b>Hasil Gambar:</b>\n`;
      images.slice(0, 5).forEach((img, i) => {
        txt += `${i + 1}. <a href="${img.sourceUrl}">${img.title}</a>\n`;
      });
      txt += `\n`;
    }

    if (videos.length > 0) {
      txt += `🎬 <b>Hasil Video:</b>\n`;
      videos.slice(0, 5).forEach((vid, i) => {
        if (vid.link && vid.title) {
          txt += `${i + 1}. <a href="${vid.link}">${vid.title}</a>\n`;
        }
      });
    }

    await client.sendMessage(chatId, {
      message: txt,
      parseMode: "html",
      linkPreview: false
    });

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "addcase": {
  if (!isOwner) return messOwner();

  const filePath = path.join(__dirname, "case.js");
  let fileContent = fs.readFileSync(filePath, "utf8");

  let newCase = text?.trim();
  if (!newCase) return msg.reply({ message: "Format salah!" });

  // Cari posisi case "..."
  const caseStartIndex = newCase.indexOf('case "');
  if (caseStartIndex === -1) return msg.reply({ message: "Format salah! Harus ada case \"nama\":" });
  newCase = newCase.slice(caseStartIndex);

  // Ambil nama case
  let caseMatch = newCase.match(/case\s+"([^"]+)":/);
  if (!caseMatch) return msg.reply({ message: "Gagal mengambil nama case!" });
  let caseName = caseMatch[1];

  // Cek duplikat
  const commandPattern = /case\s+"([^"]+)":/g;
  let match;
  while ((match = commandPattern.exec(fileContent)) !== null) {
    if (match[1] === caseName) return msg.reply({ message: `Case \`${caseName}\` sudah ada.` });
  }

  // Cari posisi insert
  const breakPattern = /break;?\s*(\/\/.*)?$/gm;
  let breakMatch, insertIndex = -1;
  while ((breakMatch = breakPattern.exec(fileContent)) !== null) {
    insertIndex = breakMatch.index + breakMatch[0].length;
  }

  const defaultIndex = fileContent.indexOf("default:");
  if (insertIndex === -1) {
    if (defaultIndex === -1) return msg.reply({ message: "Tidak dapat menemukan `default:`." });
    insertIndex = defaultIndex;
  }

  let newContent = fileContent.slice(0, insertIndex) + `\n${newCase}\n` + fileContent.slice(insertIndex);
  fs.writeFileSync(filePath, newContent, "utf8");

  await msg.reply({ message: `✅ Case \`${caseName}\` berhasil ditambahkan!` });
  break;
}

case "delcase": {
  if (!isOwner) return messOwner();
  if (!text) return msg.reply({ message: "Masukkan nama case yang ingin dihapus!" });

  const filePath = path.join(__dirname, "case.js");
  let fileContent = fs.readFileSync(filePath, "utf8");

  const casePattern = new RegExp(`case\\s+"${text}":(?:\\s*case\\s+"[^"]+":)*\\s*{`, "g");
  let match = casePattern.exec(fileContent);
  if (!match) return msg.reply({ message: `Case \`${text}\` tidak ditemukan.` });

  let startIndex = match.index;
  let endIndex = -1;

  for (let i = startIndex; i < fileContent.length; i++) {
    if (fileContent.substring(i, i + 6) === "break;") {
      endIndex = i + 6;
      break;
    }
    if (fileContent.substring(i, i + 5) === "break") {
      endIndex = i + 5;
      break;
    }
  }

  if (endIndex === -1) return msg.reply({ message: `Gagal menghapus case \`${text}\`.` });

  fileContent = fileContent.slice(0, startIndex) + fileContent.slice(endIndex);
  fs.writeFileSync(filePath, fileContent, "utf8");

  await msg.reply({ message: `✅ Case \`${text}\` berhasil dihapus!` });
  break;
}

case "setstatus": {
  if (!isOwner) return messOwner();
  if (!text) {
    await msg.reply({ message: `📌 <b>Penggunaan:</b>\n.setstatus &lt;cmd&gt; &lt;status&gt;\n\nContoh:\n.setstatus waifu ❌ Error\n.setstatus tiktok ✅`, parseMode: "html" });
    break;
  }
  const parts = text.split(" ");
  const cmdName = parts[0].toLowerCase();
  const status = parts.slice(1).join(" ") || "✅";
  global.cmdStatus[cmdName] = status;
  await msg.reply({ message: `✅ Status <b>.${cmdName}</b> → ${status}`, parseMode: "html" });
  break;
}

case "mediafire":
case "mf": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.mf &lt;link&gt;\n\nContoh:\n.mf https://www.mediafire.com/file/xxx`,
      parseMode: "html"
    });
    break;
  }

  const mfUrl = text.trim();
  await msg.reply({ message: "⏳ Mengambil file MediaFire..." });

  try {
    const mediaFire = require("./lib/mediafire");
    const data = await mediaFire(mfUrl);

    if (!data.download) throw new Error("Link download tidak ditemukan");
    
const tmpPath = await downloadToTemp(data.download, data.ext || "bin");

    await client.sendFile(chatId, {
      file: data.download,
      caption: `📁 <b>MediaFire Downloader</b>\n\n📄 <b>Nama:</b> ${data.filename}\n📦 <b>Tipe:</b> ${data.ext?.toUpperCase() || "-"}\n💾 <b>Ukuran:</b> ${data.size || "-"}`,
      parseMode: "html",
      forceDocument: true
    });

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message || e.msg}` });
  }

  break;
}

// search
case "npm":
case "npmsearch": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.npm &lt;nama package&gt;\n\nContoh:\n.npm baileys`,
      parseMode: "html"
    });
    break;
  }

  const query = text.trim();
  await msg.reply({ message: "⏳ Mencari package NPM..." });

  try {
    const res = await fetchJson(
      `https://api.danzy.web.id/api/search/npm?q=${encodeURIComponent(query)}`
    );

    const result = res?.result;
    if (!result || result.length === 0) throw new Error("Package tidak ditemukan");

    // Ambil 5 hasil teratas
    const top5 = result.slice(0, 5);

    let text2 = `🔍 <b>Hasil Pencarian NPM: "${query}"</b>\n`;
    text2 += `📦 Ditemukan ${result.length} package\n\n`;

    for (let i = 0; i < top5.length; i++) {
      const pkg = top5[i];
      const npmLink = pkg.links?.npm || "N/A";
      const homepage = pkg.links?.homepage !== "N/A" ? pkg.links?.homepage : null;
      const date = pkg.date ? new Date(pkg.date).toLocaleDateString("id-ID") : "N/A";

      text2 += `${i + 1}. <b>${pkg.name}</b>\n`;
      text2 += `   📌 Versi: <code>${pkg.version}</code>\n`;
      text2 += `   📝 ${pkg.description || "Tidak ada deskripsi"}\n`;
      text2 += `   📅 Update: ${date}\n`;
      text2 += `   🔗 <a href="${npmLink}">NPM</a>`;
      if (homepage) text2 += ` | <a href="${homepage}">Homepage</a>`;
      text2 += `\n\n`;
    }

    await msg.reply({
      message: text2,
      parseMode: "html",
      linkPreview: false
    });

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}
case "nsfwai": {
if (!isOwner && !isSeller) return messOwner()
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.imagine &lt;deskripsi&gt;\n\nContoh:\n.imagine sunset over the ocean`,
      parseMode: "html"
    });
    break;
  }

  const prompt = text.trim();
  await msg.reply({ message: "⏳ Membuat gambar..." });

  try {
    const res = await fetchJson(
      `https://api.danzy.web.id/api/ai/nsfwgen?q=${encodeURIComponent(prompt)}`
    );

    const imageUrl = res?.result?.images?.[0] || res?.result?.url || null;
    if (!imageUrl) throw new Error("Gagal generate gambar");

    await client.sendFile(chatId, {
      file: imageUrl,
      caption: `🎨 <b>Text to Image</b>\n\n📝 <b>Prompt:</b> ${prompt}`,
      parseMode: "html"
    });

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "ytsearch":
case "yt": {
  if (!text || !text.trim()) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\n.yt &lt;keyword&gt;\n\nContoh:\n.yt Bahagia Lagi`,
      parseMode: "html"
    });
    break;
  }

  const query = text.trim();
  await msg.reply({ message: "⏳ Mencari di YouTube..." });

  try {
    const res = await fetchJson(
      `https://api.juun4.cloud/search/youtube?query=${encodeURIComponent(query)}&apikey=free`
    );

    const videos = res?.result?.videos;
    if (!videos || videos.length === 0) throw new Error("Video tidak ditemukan");

    // Simpan hasil search sementara
    global.ytSearch = global.ytSearch || {};
    global.ytSearch[chatId.toString()] = videos.slice(0, 5);

    const top5 = videos.slice(0, 5);
    let txt = `🎬 <b>YouTube Search</b>\n🔍 <b>Keyword:</b> ${query}\n📹 <b>Total:</b> ${videos.length} video\n\n`;

    for (let i = 0; i < top5.length; i++) {
      const v = top5[i];
      const views = v.views?.toLocaleString("id-ID") || "0";
      txt += `${i + 1}. <b>${v.title}</b>\n`;
      txt += `   👤 ${v.author?.name || "Unknown"}\n`;
      txt += `   ⏱ ${v.duration} | 👁 ${views} views\n\n`;
    }

    txt += `💡 Ketik <code>.yt# 1</code> sampai <code>.yt# 5</code> untuk download audio`;

    await msg.reply({
      message: txt,
      parseMode: "html",
      linkPreview: false
    });

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "yt#": {
  if (!text || !text.trim()) {
    await msg.reply({ message: "Masukkan nomor video! Contoh: .ytdl 1" });
    break;
  }

  const num = parseInt(text.trim());
  if (isNaN(num) || num < 1 || num > 5) {
    await msg.reply({ message: "❌ Nomor tidak valid! Pilih antara 1-5" });
    break;
  }

  const savedVideos = global.ytSearch?.[chatId.toString()];
  if (!savedVideos) {
    await msg.reply({ message: "❌ Cari dulu pakai .yt keyword!" });
    break;
  }

  const video = savedVideos[num - 1];
  if (!video) {
    await msg.reply({ message: "❌ Video tidak ditemukan!" });
    break;
  }

  await msg.reply({ message: `⏳ Mengunduh audio...\n🎵 ${video.title}` });

  try {
    const dlRes = await fetchJson(
      `https://api.danzy.web.id/api/download/ytmp3?url=${encodeURIComponent(video.url)}`
    );

    const audioUrl = dlRes?.data?.downloadUrl;
    if (!audioUrl) throw new Error("Audio tidak ditemukan");

    await client.sendFile(chatId, {
      file: audioUrl,
      caption: `🎵 <b>${dlRes?.data?.title || video.title}</b>\n👤 ${video.author?.name || "Unknown"}\n⏱ ${video.duration}\n🎶 Kualitas: ${dlRes?.data?.quality || "128k"}`,
      parseMode: "html"
    });

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

case "ping": {
  const start = Date.now();
  const sent = await client.sendMessage(chatId, {
    message: "🏓 Pong...",
    replyTo: msg.id,
    parseMode: "html",
  });
  const latency = Date.now() - start;
  await sent.edit({ text: `📍Pong! <b>${latency}ms</b>`, parseMode: "html" });
  break;
}

// MENU GROUP
case "hidetag":
case "ht": 
case "tagall": {
  if (!msg.isGroup) return messGroup()
  if (!argText) return reply(`Masukan teks untuk hidetag!\n\nContoh penggunaan:\n<code>${cmd}</code> Ayo makan siang!`)
  
  const teksUtama = argText.trim() || 'Hadirrr...'
  let participants
  try {
    participants = await client.getParticipants(msg.chatId)
  } catch (err) {
    console.error("Gagal mendapatkan partisipan grup:", err)
    return reply("❌ Gagal mendapatkan daftar anggota grup.")
  }

  const usersToTag = participants
    .filter(p => p.id)
    .map(p => p.id)

  if (usersToTag.length === 0) {
    return reply("⚠️ Tidak ada anggota grup yang bisa di-tag.")
  }

  // Buat satu pesan untuk semua tag
  let messageBody = teksUtama
  for (const userId of usersToTag) {
    messageBody += `<a href="tg://user?id=${userId.toString()}">\u200B</a>`
  }

  try {
    await client.sendMessage(msg.chatId, {
      message: messageBody.trim(),
      parseMode: 'html'
    })
  } catch (err) {
    console.error("Gagal mengirim hidetag:", err)
    return reply("❌ Gagal mengirim hidetag.")
  }
}
break

case "self": {
  if (!isOwner) return messOwner()
  if (global.modeSelf) return reply("Bot sudah dalam mode Self ✅")

  global.modeSelf = true

  let configFile = fs.readFileSync("./config.js", "utf-8")
  configFile = configFile.replace(
    /global\.modeSelf\s*=\s*(true|false)/,
    "global.modeSelf = true"
  )
  fs.writeFileSync("./config.js", configFile, "utf-8")

  reply("🔒 Bot sekarang dalam mode Self")
}
break;

case "public": {
  if (!isOwner) return messOwner()
  if (!global.modeSelf) return reply("Bot sudah dalam mode Public ✅")

  global.modeSelf = false

  let configFile = fs.readFileSync("./config.js", "utf-8")
  configFile = configFile.replace(
    /global\.modeSelf\s*=\s*(true|false)/,
    "global.modeSelf = false"
  )
  fs.writeFileSync("./config.js", configFile, "utf-8")

  reply("🔓 Bot sekarang dalam mode Public")
}
break;

case "toanime":
case "anime": {
  if (!msg.replyTo) {
    await msg.reply({
      message: `📌 <b>Penggunaan Command</b>\n\nBalas foto dengan .anime\n\nContoh:\n[balas foto] .anime`,
      parseMode: "html"
    });
    break;
  }

  await msg.reply({ message: "⏳ Mengubah foto ke anime..." });

  try {
    // Download foto yang direply
    const replied = await client.getMessages(chatId, { ids: msg.replyTo.replyToMsgId });
    const replyMsg = replied[0];

    if (!replyMsg?.media) throw new Error("Balas foto terlebih dahulu!");

    // Download foto ke temp
    const tmpInput = path.join(__dirname, "tmp", `input_${Date.now()}.jpg`);
    if (!fs.existsSync(path.join(__dirname, "tmp"))) {
      fs.mkdirSync(path.join(__dirname, "tmp"));
    }
    await client.downloadMedia(replyMsg, { outputFile: tmpInput });

    // Upload ke API
    const FormData = require("form-data");
    const form = new FormData();
    form.append("file", fs.createReadStream(tmpInput));

const uploadRes = await axios.post(
  `https://skyzopedia-api2.vercel.app/tools/jadianime`,
  form,
  { headers: form.getHeaders() }
);
//https://skyzopedia-api2.vercel.app/tools/jadianime
console.log("Anime API response:", JSON.stringify(uploadRes?.data));

const resultUrl = uploadRes?.data?.result;
    
    if (!resultUrl) throw new Error("Gagal generate anime");

    const tmpOutput = await downloadToTemp(resultUrl, "png");
    await client.sendFile(chatId, {
      file: tmpOutput,
      caption: `🎨 <b>To Anime</b>\n\n✅ Berhasil diubah ke gaya anime!`,
      parseMode: "html"
    });
    fs.unlinkSync(tmpOutput);

  } catch (e) {
    await msg.reply({ message: `❌ Error: ${e.message}` });
  }

  break;
}

// RANDOM MENU
case "tourl": {
  let targetMessage
  if (msg.replyToMsgId) {
    try {
      const replied = await msg.getReplyMessage()
      if (replied) {
        targetMessage = replied
      }
    } catch (error) {
      console.error("Gagal mengambil pesan yang dibalas:", error.message)
    }
  }

  const msgMedia = targetMessage?.media
  
  if (!msgMedia) {
    return reply("Reply media (foto, video, atau dokumen) untuk menggunakannya.")
  }
  let buffer
  try {
    buffer = await targetMessage.downloadMedia({
      downloadUrl: false
    })
  } catch (error) {
    console.error("Gagal mendownload media:", error.message)
    return reply("❌ Gagal mendownload media.")
  }

  if (!buffer) {
    return reply("❌ Gagal mendapatkan data buffer dari media.")
  }

  const FormData = (await import("form-data")).default
  const { fileTypeFromBuffer } = await import("file-type")
  const fetchModule = await import("node-fetch")
  const fetch = fetchModule.default

  async function uploadToCatbox(buf) {
    let { ext } = await fileTypeFromBuffer(buf)
    let bodyForm = new FormData()
    bodyForm.append("fileToUpload", buf, "file." + ext)
    bodyForm.append("reqtype", "fileupload")
    
    let res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: bodyForm
    })
    
    let data = await res.text()
    return data
  }

  try {
    const url = await uploadToCatbox(buffer)
    await reply(`✅ Media berhasil diupload:\n${url}`)
  } catch (error) {
    console.error("Gagal upload ke Catbox:", error.message)
    await reply("❌ Terjadi kesalahan saat mengupload media.")
  }
}
break


case "info": {
  const sender = await client.getEntity(msg.senderId);
  const info = `<blockquote>
🆔 ID: <code>${sender.id}</code>
📛 Nama: <b>${sender.firstName || ""} ${sender.lastName || ""}</b>
👤 Username: @${sender.username || "-"}
🌐 Bot: ${sender.bot ? "Ya" : "Tidak"}
✅ Premium: ${sender.premium ? "Ya" : "Tidak"}
</blockquote>
`;
  await reply(info);
  break;
}

case "listgc": {
  if (!isOwner) return messOwner()
  await reply("<b>⚙️ Mengambil daftar grup & channel...</b>");
  const dialogs = await client.getDialogs();
  const targets = dialogs.filter((d) => d.isGroup || d.isChannel);
  if (targets.length === 0) return reply("<b>⚠️ Tidak ada grup atau channel ditemukan.</b>");
  let list = "<b>Daftar Grup/Channel:</b>\n\n";
  targets.forEach((d, i) => {
    list += `${i + 1}. ${d.name || "(Tanpa Nama)"} - <code>${d.id}</code>\n`;
  });
  await client.sendMessage(msg.chatId, { message: list, parseMode: "html", replyTo: msg.id });        
  break;
}

case "bl": {
  if (!isOwner) return messOwner()
  if (!msg.isGroup) return messGroup()
  const groupId = msg.chatId.toString();
  const group = await client.getEntity(chatId);
  if (blacklist.includes(groupId)) return reply(`⚠️ Grup <b>${group.title}</b> sudah ada di blacklist.`);
  blacklist.push(groupId);
  saveBlacklist(blacklist);
  await reply(`✅ Grup <b>${group.title}</b> berhasil ditambahkan ke blacklist.`);
  break;
}

case "delbl": {
  if (!isOwner) return messOwner()
  if (!msg.isGroup) return messGroup()
  const groupId = msg.chatId.toString();
  const group = await client.getEntity(chatId);
  if (!blacklist.includes(groupId)) return reply(`⚠️ Grup <b>${group.title}</b> tidak ada di blacklist.`);
  blacklist = blacklist.filter((id) => id !== groupId);
  saveBlacklist(blacklist);
  await reply(`✅ Grup <b>${group.title}</b> dihapus dari blacklist.`);
  break;
}

case "listbl": {
  if (!isOwner) return messOwner()
  if (blacklist.length === 0) return reply("✅ Tidak ada grup dalam blacklist.");
  let txt = "<b>📜 Daftar Grup Blacklist:</b>\n\n";
  for (const [i, id] of blacklist.entries()) {
    try {
      const group = await client.getEntity(id);
      txt += `${i + 1}. ${group.title} (<code>${id}</code>)\n`;
    } catch {
      txt += `${i + 1}. [Tidak diketahui] (<code>${id}</code>)\n`;
    }
  }
  await reply(txt);
  break;
}

case "resetbl": {
  if (!isOwner) return messOwner()
  blacklist = [];
  saveBlacklist(blacklist);
  await reply("✅ Semua grup dalam blacklist telah dihapus.");
  break;
}

case "bc": {
  if (!isOwner) return messOwner()
  if (!argText) return reply(`Masukan teks broadcast!\n\nContoh penggunaan:\n<code>${cmd}</code> teks`);       
  const dialogs = await client.getDialogs();
  const targets = dialogs.filter((d) => (d.isGroup || d.isChannel) && !blacklist.includes(d.id.toString()));
  await reply(`📢 <b>Mulai mengirim broadcast ke ${targets.length} grup & channel...</b>`);
  let sukses = 0, gagal = 0;
  for (const d of targets) {
    try {
      await client.sendMessage(d.id, { message: argText, parseMode: "html" });
      sukses++;
    } catch (e) {
      gagal++;
    }
    await sleep(0);
  }
  await reply(`✅ <b>Broadcast selesai!</b>\n\nSukses: ${sukses}\nGagal: ${gagal}\nBlacklist: ${blacklist.length}`);
  break;
}

case "cfd": {
  if (!isOwner) return messOwner()
  if (!msg.replyToMsgId) return reply(`Reply pesannya!\n\nContoh penggunaan:\n<code>${cmd}</code> dengan reply pesan`);       
  const replied = await msg.getReplyMessage();
  if (!replied) return reply("⚠️Tidak dapat menemukan pesan yang dibalas.");
  const dialogs = await client.getDialogs();
  const peerFrom = replied.fwdFrom && replied.fwdFrom.fromId.className == "PeerChannel" ? replied.fwdFrom.fromId : replied.chat
  const targets = dialogs.filter((d) => (d.isGroup || d.isChannel) && !blacklist.includes(d.id.toString()));
  await reply(`🔁 <b>Forward pesan ke ${targets.length} grup/channel...</b>`);
  let sukses = 0, gagal = 0;
  for (const d of targets) {
    try {
      await client.forwardMessages(d.id, { messages: [replied.id], fromPeer: replied.chat });
      sukses++;
    } catch (e) {
      gagal++;
      console.log(`[•] Fwd ${d.title} Error: ${e}`)
    }
    await sleep(0);
  }
  await reply(`✅ <b>Forward selesai!</b>\n\nSukses: ${sukses}\nGagal: ${gagal}\nBlacklist: ${blacklist.length}`);
  break;
}

case "pushkontak": {
  if (!isOwner) return messOwner()
  if (!msg.isGroup) return messGroup()
  const replied = await msg.getReplyMessage();
  if (!replied) return reply(`Reply pesannya!\n\nContoh penggunaan:\n<code>${cmd}</code> dengan reply pesan`); 
  try {
    const groupEntity = await client.getEntity(msg.chatId);
    const participants = await client.getParticipants(groupEntity);
    await reply(`<b>⏳ Memulai forward pesan ke ${participants.length} anggota grup...</b>`);
    let sentCount = 0;
    for (const user of participants) {
      if (user.bot || !user.id) continue;
      try {v
        await client.forwardMessages(user.id, { fromPeer: msg.chatId, id: [replied.id] });
        sentCount++;
      } catch (err) {
        console.log(`Gagal forward ke ${user.id}:`, err?.message || err);
      }
      await sleep(2000);
    }
    await reply(`<b>✅ Selesai forward ke ${sentCount} anggota grup!</b>`);
  } catch (err) {
    console.error("pushkontak error:", err);
    await reply("<b>❌ Terjadi kesalahan saat menjalankan pushkontak.</b>");
  }
  break;
}

case "pay":
case "payment": {
  if (!global.dana && !global.ovo && !global.gopay && !global.qris)
    return reply("<b>⚠️ Informasi pembayaran belum dikonfigurasi.</b>");
  try {
    const paymentList = `
<blockquote><b>Dana :</b></blockquote> <code>${global.dana || "-"}</code>

<blockquote><b>Ovo :</b></blockquote> <code>${global.ovo || "-"}</code>

<blockquote><b>Gopay :</b></blockquote> <code>${global.gopay || "-"}</code>

<blockquote>Wajib kirimkan bukti transfer demi keamanan bersama.</blockquote>
`;
    const Url = global.qris && global.qris.includes("https://") ? global.qris : "https://files.catbox.moe/1am1f3.jpg";
    await client.sendFile(msg.chatId, { file: Url, caption: paymentList, replyTo: msg.id, parseMode: "html" });
  } catch (err) {
    console.error("pay error:", err);
    await reply("❌ Gagal mengirimkan informasi pembayaran.");
  }
  break;
}

case "done":
case "don":
case "proses":
case "ps": {
  if (!isOwner) return messOwner()
  if (!argText) return reply(`Masukan teks transaksi!\n\nContoh penggunaan:\n<code>${cmd}</code> Jasa Fix Error`);       

  const status = /done|don/.test(command) ? "<b>TRANSAKSI DONE ✅</b>" : "<b>DANA TELAH DITERIMA ✅</b>";
  const teks = `
<blockquote>${status}</blockquote>

📦 <b>Pembelian:</b> ${argText}
🗓️ <b>Tanggal:</b> ${global.tanggal ? global.tanggal(Date.now()) : new Date().toLocaleString()}

📢 <b>Cek Testimoni Pembeli:</b>
${global.linkChannel ? global.linkChannel : "-"}

🏠 <b>Gabung Grup Share & Promosi:</b>
${global.linkGrup ? global.linkGrup : "-"}
`;
  try {
    await client.sendMessage(msg.chatId, { message: teks, parseMode: "html", linkPreview: false });
  } catch (err) {
    console.error("done error:", err);
    await reply("❌ Gagal mengirim pesan konfirmasi transaksi.");
  }
  break;
}

case "backupsc":
case "bck":
case "backup": {
  if (!isOwner) return messOwner()
  try {
    await reply("⏳ <b>Memproses Backup Script...</b>");
    const bulanIndo = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const tgl = new Date();
    const tanggal = tgl.getDate().toString().padStart(2, "0");
    const bulan = bulanIndo[tgl.getMonth()];
    const name = `SimpleUbot-${tanggal}-${bulan}-${tgl.getFullYear()}`;

    const exclude = ["node_modules","package-lock.json","yarn.lock",".npm",".cache"];
    const filesToZip = fs.readdirSync(".").filter((f) => !exclude.includes(f) && f !== "");

    if (!filesToZip.length) return reply("❌ <b>Tidak ada file yang dapat di-backup.</b>");

    const output = fs.createWriteStream(`./${name}.zip`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);

    for (let file of filesToZip) {
      const stat = fs.statSync(file);
      if (stat.isDirectory()) archive.directory(file, file);
      else archive.file(file, { name: file });
    }

    await archive.finalize();

    output.on("close", async () => {
      try {
        await client.sendFile(global.ownerID, { file: `./${name}.zip`, caption: "✅ <b>Backup Script selesai!</b>", parseMode: "html" });
        fs.unlinkSync(`./${name}.zip`);
        if (msg.chatId.toString() !== global.ownerID?.toString()) {
          await client.sendMessage(msg.chatId, { message: "✅ <b>Backup script selesai!</b>\nFile telah dikirim ke chat pribadi.", replyTo: msg.id, parseMode: "html" });
        }
      } catch (err) {
        console.error("Gagal kirim file backup:", err);
        await reply("❌ <b>Gagal mengirim file backup ke chat pribadi.</b>");
      }
    });
  } catch (err) {
    console.error("Backup Error:", err);
    await reply("❌ <b>Terjadi kesalahan saat melakukan backup.</b>");
  }
  break;
}


case "1gb": case "2gb": case "3gb": case "4gb": case "5gb":
case "6gb": case "7gb": case "8gb": case "9gb": case "10gb":
case "unlimited": case "unli": {
  if (!isOwner && !isSeller) return messOwner()
  if (!argText) return reply(`<blockquote> Masukan username!\n\nContoh penggunaan:\n<code>${cmd}</code> Dika
  </blockquote>`);       

  const username = argText.toLowerCase();
  const email = `${username}@gmail.com`;
  const name = `${global.capital ? global.capital(username) : username} Server`;
  const password = `${username}001`;

  const resourceMap = {
    "1gb": { ram: "1000", disk: "1000", cpu: "40" },
    "2gb": { ram: "2000", disk: "1000", cpu: "60" },
    "3gb": { ram: "3000", disk: "2000", cpu: "80" },
    "4gb": { ram: "4000", disk: "2000", cpu: "100" },
    "5gb": { ram: "5000", disk: "3000", cpu: "120" },
    "6gb": { ram: "6000", disk: "3000", cpu: "140" },
    "7gb": { ram: "7000", disk: "4000", cpu: "160" },
    "8gb": { ram: "8000", disk: "4000", cpu: "180" },
    "9gb": { ram: "9000", disk: "5000", cpu: "200" },
    "10gb": { ram: "10000", disk: "5000", cpu: "220" },
    "unlimited": { ram: "0", disk: "0", cpu: "0" }
  };

  const { ram, disk, cpu } = resourceMap[command] || { ram: "0", disk: "0", cpu: "0" };

  try {
    // create user
    const f = await fetch(`${global.domain}/api/application/users`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${global.apikey}` },
      body: JSON.stringify({ email, username, first_name: name, last_name: "Server", language: "en", password })
    });
    const data = await f.json();
    if (data.errors) return reply("❌ <b>Error:</b> " + JSON.stringify(data.errors[0], null, 2));
    const user = data.attributes;

    // get egg startup
    const f1 = await fetch(`${global.domain}/api/application/nests/${global.nestid}/eggs/${global.egg}`, {
      method: "GET",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${global.apikey}` }
    });
    const data2 = await f1.json();
    const startup_cmd = data2.attributes?.startup || "npm start";

    // create server
    const f2 = await fetch(`${global.domain}/api/application/servers`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${global.apikey}` },
      body: JSON.stringify({
        name,
        description: global.tanggal ? global.tanggal(Date.now()) : new Date().toLocaleString(),
        user: user.id,
        egg: parseInt(global.egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: startup_cmd,
        environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
        limits: { memory: ram, swap: 0, disk, io: 500, cpu },
        feature_limits: { databases: 5, backups: 5, allocations: 5 },
        deploy: { locations: [parseInt(global.loc)], dedicated_ip: false, port_range: [] },
      })
    });
    const result = await f2.json();
    if (result.errors) return reply("❌ <b>Error:</b> " + JSON.stringify(result.errors[0], null, 2));
    const server = result.attributes;

    // domain spoiler (HTML <spoiler>)
    const domainTeks = (global.domain || "").replace(/https?:\/\//g, "");
    const tampilDomain = `<spoiler>${domainTeks}</spoiler>`;

    const teks = `
✅ <b>Berhasil membuat akun panel</b>

📡 <b>Server ID:</b> <code>${server.id}</code>
👤 <b>Username:</b> <code>${user.username}</code>
🔐 <b>Password:</b> <code>${password}</code>
🗓️ <b>Tanggal Aktivasi:</b> ${global.tanggal ? global.tanggal(Date.now()) : new Date().toLocaleString()}

⚙️ <b>Spesifikasi server panel:</b>
- RAM: ${ram === "0" ? "Unlimited" : ram / 1000 + "GB"}
- Disk: ${disk === "0" ? "Unlimited" : disk / 1000 + "GB"}
- CPU: ${cpu === "0" ? "Unlimited" : cpu + "%"}
- Panel: ${tampilDomain}

📝 <b>Rules pembelian panel:</b>
- Masa aktif 30 hari
- Data bersifat pribadi, simpan dengan aman
- Garansi berlaku 15 hari (1x replace)
- Klaim garansi wajib menyertakan bukti chat pembelian
`;

    // send result: if invoked in group -> send notice to group + details via private message to sender
    const chatTarget = msg.isGroup ? msg.senderId : msg.chatId;
    if (msg.isGroup) {
      await reply("✅ <b>Berhasil membuat akun panel!</b>\n📩 Data akun telah dikirim ke private chat.");
    }
    await client.sendMessage(chatTarget, { message: teks, parseMode: "html", linkPreview: false });
  } catch (err) {
    console.error("create panel error:", err);
    await reply("❌ <b>Terjadi kesalahan saat membuat panel:</b> " + (err?.message || err));
  }
  break;
}

case "listpanel":
case "listserver": {
  if (!isOwner && !isSeller) return messOwner()
  try {
    const response = await fetch(`${global.domain}/api/application/servers`, {
      method: "GET",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${global.apikey}` }
    });
    const result = await response.json();
    const servers = result.data || [];
    if (servers.length === 0) return reply("⚠️ <b>Tidak ada server panel!</b>");

    let teks = `<b>Total server panel:</b> ${servers.length}\n`;
    for (const server of servers) {
      const s = server.attributes;
      const ram = s.limits.memory === 0 ? "Unlimited" : (s.limits.memory >= 1024 ? `${Math.floor(s.limits.memory / 1024)} GB` : `${s.limits.memory} MB`);
      const disk = s.limits.disk === 0 ? "Unlimited" : (s.limits.disk >= 1024 ? `${Math.floor(s.limits.disk / 1024)} GB` : `${s.limits.disk} MB`);
      const cpu = s.limits.cpu === 0 ? "Unlimited" : `${s.limits.cpu}%`;
      teks += `
• <b>ID:</b> <code>${s.id}</code>
• <b>Nama Server:</b> ${s.name}
• <b>RAM:</b> ${ram}
• <b>Disk:</b> ${disk}
• <b>CPU:</b> ${cpu}
• <b>Dibuat:</b> ${s.created_at?.split("T")[0] || "-"}\n`;
    }
    await client.sendMessage(msg.chatId, { message: teks, parseMode: "html", replyTo: msg.id });
  } catch (err) {
    console.error("Error listing panel servers:", err);
    await reply("⚠️ <b>Terjadi kesalahan saat mengambil data server.</b>");
  }
  break;
}

case "delpanel": {
  if (!isOwner && !isSeller) return messOwner()
  if (!argText) return reply(`Input ID Server!\n\nContoh penggunaan:\n<code>${cmd}</code> 13`);       

  const ids = argText.split(",").map(id => id.trim()).filter(Boolean);

  try {
    const [serverRes, userRes] = await Promise.all([
      fetch(`${global.domain}/api/application/servers`, {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${global.apikey}` }
      }),
      fetch(`${global.domain}/api/application/users`, {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${global.apikey}` }
      })
    ]);

    const serverData = await serverRes.json();
    const userData = await userRes.json();
    const servers = serverData.data || [];
    const users = userData.data || [];

    if (!servers.length) return reply("⚠️ <b>Tidak ada server yang ditemukan!</b>");

    let resultMsg = "\n";

    for (const id of ids) {
      const server = servers.find(s => s.attributes.id === Number(id));
      if (!server) {
        resultMsg += `❌ <b>ID ${id}:</b> Tidak ditemukan.\n`;
        continue;
      }

      const s = server.attributes;
      const serverName = s.name;
      const serverSection = s.name.toLowerCase();

      try {
        const delServer = await fetch(`${global.domain}/api/application/servers/${s.id}`, {
          method: "DELETE",
          headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${global.apikey}` }
        });

        if (!delServer.ok) {
          resultMsg += `⚠️ <b>ID ${id}:</b> Gagal hapus server (${serverName}).\n`;
          continue;
        }

        // remove associated user (match by first_name lowercased)
        const user = users.find(u => u.attributes.first_name && u.attributes.first_name.toLowerCase() === serverSection);
        if (user) {
          await fetch(`${global.domain}/api/application/users/${user.attributes.id}`, {
            method: "DELETE",
            headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${global.apikey}` }
          });
        }

        resultMsg += `✅ <b>ID ${id}:</b> Berhasil hapus server <b>${global.capital ? global.capital(serverName) : serverName}</b>.\n`;
      } catch (err) {
        console.error(`Gagal hapus server ID ${id}:`, err);
        resultMsg += `❌ <b>ID ${id}:</b> Terjadi error internal.\n`;
      }
    }

    await client.sendMessage(msg.chatId, { message: resultMsg.trim(), parseMode: "html", replyTo: msg.id });
  } catch (err) {
    console.error("Error dalam proses delpanel:", err);
    await reply("❌ <b>Terjadi kesalahan saat memproses permintaan.</b>");
  }
  break;
}
      
case "cadmin": {
  if (!isOwner) return messOwner()
  if (!argText) return reply(`Masukan username!\n\nContoh penggunaan:\n<code>${cmd}</code> RazorOffc`);       

  const username = argText.toLowerCase();
  const email = `${username}@gmail.com`;
  const name = username.charAt(0).toUpperCase() + username.slice(1);
  const password = `${username}001`;
  const chatTarget = msg.isGroup ? msg.senderId : msg.chatId;

  try {
    const res = await fetch(`${global.domain}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${global.apikey}`
      },
      body: JSON.stringify({
        email,
        username,
        first_name: name,
        last_name: "Admin",
        root_admin: true,
        language: "en",
        password
      })
    });

    const data = await res.json();
    if (data.errors) return reply(`${JSON.stringify(data.errors[0], null, 2)}`);

    const user = data.attributes;

    const ram = 0;
    const disk = 0;
    const cpu = 0;
    const server = { id: "N/A" };

    const domainTeks = (global.domain || "").replace(/https?:\/\//g, "");
    const tampilDomain = `<spoiler>${domainTeks}</spoiler>`;

    const teks = `
✅ <b>Berhasil membuat akun panel</b>

📡 <b>Server ID:</b> <code>${server.id}</code>
👤 <b>Username:</b> <code>${user.username}</code>
🔐 <b>Password:</b> <code>${password}</code>
🗓️ <b>Tanggal Aktivasi:</b> ${global.tanggal ? global.tanggal(Date.now()) : new Date().toLocaleString()}

⚙️ <b>Spesifikasi server panel:</b>
- RAM: ${ram === 0 ? "Unlimited" : ram / 1000 + "GB"}
- Disk: ${disk === 0 ? "Unlimited" : disk / 1000 + "GB"}
- CPU: ${cpu === 0 ? "Unlimited" : cpu + "%"}
- Panel: ${tampilDomain}

📝 <b>Rules pembelian panel:</b>
- Masa aktif 30 hari
- Data bersifat pribadi, simpan dengan aman
- Garansi berlaku 15 hari (1x replace)
- Klaim garansi wajib menyertakan bukti chat pembelian
`;

    if (msg.isGroup) {
      await reply("✅ Berhasil membuat akun panel!\n📩 Data akun telah dikirim ke private chat.");
    }

    await reply(teks, { parseMode: "html", jid: chatTarget });

  } catch (err) {
    console.error(err);
    await reply("⚠️ Terjadi kesalahan saat membuat akun panel.");
  }
}
break;

case "deladmin": {
  if (!isOwner) return messOwner()
  if (!argText) return reply(`Input ID User!\n\nContoh penggunaan:\n<code>${cmd}</code> 13`);

  try {
    const res = await fetch(`${domain}/api/application/users`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apikey}`
      }
    });
    const data = await res.json();
    const users = data.data;

    const targetAdmin = users.find(e => e.attributes.id == argText && e.attributes.root_admin === true);
    if (!targetAdmin) return reply("Gagal menghapus admin!\nID user tidak ditemukan.");

    const idadmin = targetAdmin.attributes.id;
    const username = targetAdmin.attributes.username;

    const delRes = await fetch(`${domain}/api/application/users/${idadmin}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apikey}`
      }
    });

    if (!delRes.ok) {
      const errData = await delRes.json();
      return reply(`Gagal menghapus admin!\n${JSON.stringify(errData.errors[0], null, 2)}`);
    }

    await reply(`✅ Berhasil menghapus admin panel.\nNama User: ${capital(username)}`);

  } catch (err) {
    console.error(err);
    await reply("⚠️ Terjadi kesalahan saat menghapus akun admin.");
  }
}
break;

case "listadmin": {
  if (!isOwner) return messOwner()

  try {
    const response = await fetch(`${global.domain}/api/application/users`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${global.apikey}`
      }
    });
    const result = await response.json();
    const users = result.data || [];

    const adminUsers = users.filter(u => u.attributes.root_admin === true);
    if (adminUsers.length === 0) return reply("⚠️ <b>Tidak ada admin panel!</b>");

    let teks = `<b>Total admin panel:</b> ${adminUsers.length}\n`;
    for (const admin of adminUsers) {
      const u = admin.attributes;
      teks += `
• <b>ID:</b> <code>${u.id}</code>
• <b>Nama:</b> ${u.first_name} ${u.last_name || ""}
• <b>Username:</b> ${u.username}
• <b>Dibuat:</b> ${u.created_at?.split("T")[0] || "-"}\n`;
    }

    await client.sendMessage(msg.chatId, { message: teks, parseMode: "html", replyTo: msg.id });

  } catch (err) {
    console.error("Error listing admin panel:", err);
    await reply("⚠️ <b>Terjadi kesalahan saat mengambil data admin.</b>");
  }
}
break;

case "addseller": {
if (!isOwner) return messOwner()
        
let targetId = null;

if (msg.replyToMsgId) {
    const repliedMsg = await msg.getReplyMessage();
    if (repliedMsg && repliedMsg.senderId) targetId = repliedMsg.senderId.toString();
} else if (argText) {
    const input = argText.trim();
    
    if (!isNaN(input) && input.length >= 5) {
        targetId = input;
    } else {
        try {
            const username = input.startsWith('@') ? input : `@${input}`;
            const entity = await client.getInputEntity(username);
            const sender = await client.getEntity(entity);
            targetId = sender.id.toString();
        } catch (e) {
            console.log(`[Add Seller Resolve Error]: ${e?.message || e}`);
        }
    }
}

if (!targetId) {
    return reply("Masukkan ID, @username, atau balas pesan pengguna.\n\nContoh: <code>.addseller @username</code> atau <code>.addseller 123456789</code>");
}

if (sellerList.includes(targetId)) {
  return reply(`⚠️ Pengguna <code>${targetId}</code> sudah ada di daftar Seller.`);
}

if (targetId === me.id.toString()) return reply("⚠️ Bot tidak bisa dijadikan Seller.");
if (targetId === global.ownerID?.toString()) return reply("⚠️ Owner sudah memiliki akses penuh.");

sellerList.push(targetId);
saveSellerList(sellerList);

try {
  const userEntity = await client.getEntity(targetId);
  const username = userEntity.username ? `@${userEntity.username}` : userEntity.firstName || "Pengguna";
  await reply(`✅ Pengguna <b>${username}</b> (<code>${targetId}</code>) berhasil ditambahkan sebagai Seller.`);
} catch (err) {
  await reply(`✅ ID <code>${targetId}</code> berhasil ditambahkan ke daftar Seller.`);
}
break;
}


case "resetseller": {
if (!isOwner) return messOwner()
sellerList = [];
saveSellerList(sellerList);
await reply("✅ Semua reseller panel telah dihapus.");
break;
}      

case "delseller": {
if (!isOwner) return messOwner()
        
let targetId = null;

if (msg.replyToMsgId) {
    const repliedMsg = await msg.getReplyMessage();
    if (repliedMsg && repliedMsg.senderId) targetId = repliedMsg.senderId.toString();
} else if (argText) {
    const input = argText.trim();
    
    if (!isNaN(input) && input.length >= 5) {
        targetId = input;
    } else {
        try {
            const username = input.startsWith('@') ? input : `@${input}`;
            const entity = await client.getInputEntity(username);
            const sender = await client.getEntity(entity);
            targetId = sender.id.toString();
        } catch (e) {
            console.log(`[Del Seller Resolve Error]: ${e?.message || e}`);
        }
    }
}

if (!targetId) {
    return reply("Masukkan ID, @username, atau balas pesan pengguna.\n\nContoh: <code>.delseller @username</code> atau <code>.delseller 123456789</code>");
}

if (!sellerList.includes(targetId)) {
  return reply(`⚠️ Pengguna <code>${targetId}</code> tidak ada di daftar Seller.`);
}

sellerList = sellerList.filter((id) => id !== targetId);
saveSellerList(sellerList);

try {
  const userEntity = await client.getEntity(targetId);
  const username = userEntity.username ? `@${userEntity.username}` : userEntity.firstName || "Pengguna";
  await reply(`✅ Pengguna <b>${username}</b> (<code>${targetId}</code>) dihapus dari daftar Seller.`);
} catch {
  await reply(`✅ ID <code>${targetId}</code> berhasil dihapus dari daftar Seller.`);
}
break;
}

case "listseller": {
if (!isOwner) return messOwner()
if (sellerList.length === 0) return reply("✅ Tidak ada pengguna dalam daftar Seller.");

let txt = "<b>📜 Daftar Reseller Panel:</b>\n\n";
for (const [i, id] of sellerList.entries()) {
  try {
    const user = await client.getEntity(id);
    const username = user.username ? `@${user.username}` : user.firstName || "(Tanpa Nama)";
    txt += `${i + 1}. ${username} (<code>${id}</code>)\n`;
  } catch {
    txt += `${i + 1}. [Tidak diketahui] (<code>${id}</code>)\n`;
  }
}
await reply(txt);
break;
}

case "subdomain": case "domain": case "subdo": {

if (!isOwner) return messOwner()

const dom = global.subdomain ? Object.keys(global.subdomain) : [];

if (!argText) {
    if (dom.length === 0) {
        return reply("⚠️ Tidak ada domain yang tersedia! Harap konfigurasi <code>global.subdomain</code>.");
    }

    let teks = "🌐 Daftar Domain Tersedia:\n\n";
    dom.forEach((d, i) => {
        teks += `${i + 1}. ${d}\n`;
    });
    
    teks += `\nCara membuat subdomain:\n<code>${cmd} [nomor] hostname|ipvps</code>`;

    return reply(teks);
}

const parts = argText.split(" "); 
const domainNumber = parts[0];
const hostAndIpText = parts.slice(1).join(" ").trim();

const domainIndex = Number(domainNumber) - 1;

if (isNaN(domainIndex) || domainIndex < 0 || domainIndex >= dom.length) {
    return reply(`Domain tidak ditemukan! Masukkan nomor domain yang valid.\n\nContoh: <code>${cmd} 1 panel|1.2.3.4</code>`);
}

const tldnya = dom[domainIndex];

if (!hostAndIpText || !hostAndIpText.includes("|")) {
     return reply("⚠️ Hostname / IP tidak valid!\nContoh: <code>1 panel|1.2.3.4</code>");
}

const [host, ip] = hostAndIpText.split("|").map(str => str.trim());

if (!host || !ip) {
    return reply("⚠️ Hostname / IP tidak boleh kosong setelah pemisah '|'!");
}

const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
if (!ipRegex.test(ip)) {
     return reply("⚠️ Format IP Address tidak valid!");
}

async function subDomainAPI(subHost, ipAddress, tldConfig) {
    return new Promise((resolve) => {
        axios.post(
            `https://api.cloudflare.com/client/v4/zones/${tldConfig.zone}/dns_records`,
            {
                type: "A",
                name: `${subHost.replace(/[^a-z0-9.-]/gi, "")}.${tldnya}`,
                content: ipAddress.replace(/[^0-9.]/gi, ""),
                ttl: 3600,
                priority: 10,
                proxied: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${tldConfig.apitoken}`,
                    "Content-Type": "application/json",
                },
            }
        ).then(response => {
            let res = response.data;
            if (res.success) {
                resolve({
                    success: true,
                    name: res.result?.name,
                    ip: res.result?.content
                });
            } else {
                let errorMsg = res.errors?.[0]?.message || "Gagal membuat subdomain.";
                resolve({ success: false, error: errorMsg });
            }
        }).catch(error => {
            let errorMsg = error.response?.data?.errors?.[0]?.message || error.message || "Terjadi kesalahan pada API!";
            resolve({ success: false, error: errorMsg });
        });
    });
}

await reply("⏳ Memproses pembuatan Subdomain (Panel & Node)...");

const tldConfig = global.subdomain[tldnya];
const domnode = `node-${global.getRandom(5).toLowerCase()}`;

let teksResult = "✅ Subdomain berhasil dibuat!\n\n";
teksResult += `🌍 IP Address: <code>${ip}</code>\n`;

for (let i = 0; i < 2; i++) {
    let subHost = i === 0 ? host.toLowerCase() : domnode;
    try {
        let result = await subDomainAPI(subHost, ip, tldConfig);
        if (result.success) {
            teksResult += `${i === 0 ? "📮 Panel" : "📡 Node"}: <code>${result.name}</code>\n`;
        } else {
            return reply(`❌ Gagal membuat ${i === 0 ? "Panel" : "Node"} Subdomain: ${result.error}`);
        }
    } catch (err) {
        return reply("❌ Error saat eksekusi: " + err.message);
    }
}

await reply(teksResult);
}
break;

    

case "installpanel": {
if (!isOwner) return messOwner()

    if (!text) return reply(`Format Salah!\n\nContoh penggunaan:\n<code>${cmd}</code> ipvps|pwvps|panel.com|node.com|ramserver`);

    let vii = text.split("|");
    if (vii.length < 5) return reply(`Format Salah!\n\nContoh penggunaan:\n<code>${cmd}</code> ipvps|pwvps|panel.com|node.com|ramserver`);

    const connSettings = {
        host: vii[0],
        port: vii[5] ? parseInt(vii[5]) : 22,
        username: "root",
        password: vii[1],
    };

    const jids = msg.chatId
    const passwordPanel = "admin001";
    const domainpanel = vii[2];
    const domainnode = vii[3];
    const ramserver = vii[4];
    const commandPanel = `bash <(curl -s https://pterodactyl-installer.se)`;

    const ssh = new SSHClient();

    async function instalWings() {
        ssh.exec('bash <(curl -s https://pterodactyl-installer.se)', (err, stream) => {
            if (err) return client.sendMessage(jids, { message: `Gagal memulai instalasi Wings: ${err.message}` });

            stream.on('data', data => {
                const str = data.toString();
                console.log('Wings:', str);
                if (str.includes('Input 0-6')) stream.write('1\n');
                if (str.includes('(y/N)')) stream.write('y\n');
                if (str.includes('Enter the panel address')) stream.write(`${domainpanel}\n`);
                if (str.includes('Database host username')) stream.write('admin\n');
                if (str.includes('Database host password')) stream.write('admin\n');
                if (str.includes('Set the FQDN to use for Let\'s Encrypt')) stream.write(`${domainnode}\n`);
                if (str.includes('Enter email address for Let\'s Encrypt')) stream.write('admin@gmail.com\n');
            });

            stream.stderr.on('data', data => {
                console.error('Error Wings:', data.toString());
                client.sendMessage(jids, { message: `Error pada instalasi Wings:\n${data.toString()}` });
            });

            stream.on('close', () => InstallNodes());
        });
    }

    async function InstallNodes() {
        ssh.exec('bash <(curl -s https://raw.githubusercontent.com/SkyzoOffc/Pterodactyl-Theme-Autoinstaller/main/createnode.sh)', (err, stream) => {
            if (err) throw err;

            stream.on('data', data => {
                const str = data.toString();
                console.log('Node:', str);
                if (str.includes('Masukkan nama lokasi:')) stream.write('Singapore\n');
                if (str.includes('Masukkan deskripsi lokasi:')) stream.write('Node By Razor\n');
                if (str.includes('Masukkan domain:')) stream.write(`${domainnode}\n`);
                if (str.includes('Masukkan nama node:')) stream.write('RazorOffc\n');
                if (str.includes('Masukkan RAM')) stream.write(`${ramserver}\n`);
                if (str.includes('Masukkan jumlah maksimum disk space')) stream.write(`${ramserver}\n`);
                if (str.includes('Masukkan Locid:')) stream.write('1\n');
            });

            stream.stderr.on('data', data => {
                console.error('Node Error:', data.toString());
                client.sendMessage(jids, { message: `Error pada instalasi Node:\n${data.toString()}` });
            });

            stream.on('close', async () => {
                let teks = `
<b>✅ Install Panel Berhasil!</b>

<b>📦 Detail Akun Panel Kamu:</b>
👤 <b>Username:</b> <code>admin</code>
🔐 <b>Password:</b> <code>${passwordPanel}</code>
🌐 <a href="${domainpanel}">${domainpanel}</a>

<b>⚙️ Silakan atur allocation & ambil token node</b> pada node yang sudah dibuat oleh bot.

<b>🚀 Cara menjalankan wings:</b>
<code>.startwings</code> ipvps|pwvps|tokennode
`;
                await client.sendMessage(jids, { message: teks, parseMode: "html" });
                ssh.end();
            });
        });
    }

    ssh.on("ready", async () => {
        await client.sendMessage(jids, {
            message: `🛠️ Proses instalasi panel sedang berjalan 🚀\n\n📡 IP Address: ${vii[0]}\n🌐 Domain Panel: ${domainpanel}\n\n⏳ Mohon tunggu sekitar 1–8 menit.`,
            replyTo: msg.id
        });

        ssh.exec('\n', () => instalWings());
    });

    ssh.on("error", err => {
        console.error("SSH Connection Error:", err);
        client.sendMessage(jids, { message: `Gagal terhubung ke server: ${err.message}`, replyTo: msg.id });
    });

    ssh.connect(connSettings);
}
break;

// ================================================== //

case "startwings":
case "configurewings": {
    if (!isOwner) return messOwner()
    let t = text.split("|");
    if (t.length < 3) return reply(`Format Salah!\n\nContoh penggunaan:\n<code>${cmd}</code> ipvps|pwvps|token`);

    let [ipvps, passwd, token] = t.map(x => x.trim());
    const connSettings = { host: ipvps, port: 22, username: "root", password: passwd };
    const ssh = new SSHClient();

    ssh.on("ready", () => {
        ssh.exec(`${token} && systemctl start wings`, (err, stream) => {
            if (err) return client.sendMessage(msg.chatId, { message: "Gagal menjalankan perintah di VPS", replyTo: msg.id });

            stream.on("close", async () => {
                await client.sendMessage(msg.chatId, { message: "✅ Wings node Pterodactyl berhasil dijalankan!", replyTo: msg.id });
                ssh.end();
            }).on("data", data => console.log("STDOUT:", data.toString()))
              .stderr.on("data", data => {
                  console.log("STDERR:", data.toString());
                  client.sendMessage(msg.chatId, { message: `Terjadi error saat eksekusi:\n${data.toString()}`, replyTo: msg.id });
              });
        });
    }).on("error", err => {
        console.log("Connection Error:", err.message);
        client.sendMessage(msg.chatId, { message: "Gagal terhubung ke VPS: IP atau password salah.", replyTo: msg.id });
    }).connect(connSettings);
}
break;
          
case "eval":
case "ev": {
if (!isOwner) return
if (!argText) return reply("Masukkan kode JavaScript untuk dievaluasi.");
try {
  let result = await eval(`(async () => { ${argText} })()`);
  if (typeof result !== "string") result = require("util").inspect(result, { depth: 1 });
  if (result.length > 4000) result = result.slice(0, 4000) + "\n... (hasil terpotong)";
  await reply(`<b>✅ Eval berhasil:</b>\n<pre>${result}</pre>`);
} catch (err) {
  await reply(`<b>❌ Eval error:</b>\n<pre>${err}</pre>`);
}
break;
}


default:
break;

}
} catch (err) {
console.error("Error di case.js:", err);
}
};


let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`• File update: ${__filename}`);
  delete require.cache[file];
  require(file);
});