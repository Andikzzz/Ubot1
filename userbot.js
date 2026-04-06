const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");
const fs = require("fs");
const path = require("path");
require("./config.js");
require("./function.js");

//##################################//

const apiId = global.apiId;
const apiHash = global.apiHash;

// Lokasi file session
const sessionFile = path.join(__dirname, "session.txt");

// Baca session jika sudah ada
let sessionData = "";
if (fs.existsSync(sessionFile)) {
  sessionData = fs.readFileSync(sessionFile, "utf8").trim();
}

const session = new StringSession(sessionData);

// Inisialisasi client
const client = new TelegramClient(session, apiId, apiHash, {
  connectionRetries: 10, // Lebih tahan disconnect
  autoReconnect: true,   // Aktifkan auto reconnect
});

//##################################//

(async () => {
  console.log("[•] Menghubungkan ke Telegram...");

  try {
    await client.start({
      phoneNumber: global.phoneNumber,
      password: async () => await input.text("[•] Password 2FA (kosongkan jika tidak ada): "),
      phoneCode: async () => await input.text("[•] Kode OTP dari Telegram: "),
      onError: (err) => console.log("Login error:", err),
    });

    // Simpan session ke file
    fs.writeFileSync(sessionFile, client.session.save(), "utf8");
  } catch (err) {
    console.log("Gagal login:", err);
    process.exit(1);
  }

  console.log("[•] Userbot berhasil tersambung ke Telegram.");
  
  try {
  await global.loadChatTelegram(Api, client)
  } catch (err) {}
  try {
  await client.getDialogs()
  } catch (err) {}
  
  client.addEventHandler(
    async (event) => {
      try {
        const msg = event.message;
        require("./case.js")(client, msg);
      } catch (e) {
        console.error("Error event:", e);
      }
    },
    new NewMessage({ incoming: true, outgoing: true })
  );
  
  client.connect()

  //##################################//
})();