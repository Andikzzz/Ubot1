const fs = require("fs");

//####### SETTING TELEGRAM API #######//
// ganti dengan apiId kamu
global.apiId = 33884291 // jangan di ubah

 // ganti dengan apiHash kamu
global.apiHash = "fd4d5025fec775ac738b6d39d7c325fa" // jangan di ubah

// ganti dengan nomor telepon telegram kamu
global.phoneNumber = "6282310368376"

//########### SETTING BOT ###########//
global.modeSelf = true
global.ownerID = "8436338353"
global.ownerUsername = "Dikzforty"
global.prefix = "."
global.thumbnail = "https://files.catbox.moe/1am1f3.jpg"

//########## SETTING LINKS ###########//
global.linkChannel = "https://whatsapp.com/channel/0029VbAxzxl0lwgigLqY2l3G"
global.linkGrup = "https://whatsapp.com/channel/0029VbAxzxl0lwgigLqY2l3G"

//######### SETTING PAYMENT #########//
global.dana = "082173445477"
global.ovo = "082310368376"
global.gopay = "082310368376"
global.qris = "https://files.catbox.moe/1am1f3.jpg"

//######## SETTING API PANEL #########//
global.egg = "15" // Isi id egg
global.nestid = "5" // Isi id nest
global.loc = "1" // Isi id location
global.domain = "https://skyzopterodactyl.gacorr.biz.id"
global.apikey = "ptla_E2mEYVXNTLTG3uUVsf8rzr9tonl1M3GN5lmGCAQHTvd" // Isi api ptla
global.capikey = "ptlc_yyQ6i7utDfQQFLs803FOWH9uVTZSae2MPclY4a2iNMd" // Isi api ptlc

//######## SETTING API DOMAIN ########//
global.subdomain = {
  "skypedia.qzz.io": {
    "zone": "59c189ec8c067f57269c8e057f832c74",
    "apitoken": "mZd-PC7t7PmAgjJQfFvukRStcoWDqjDvvLHAJzHF"
  }, 
  "pteroweb.my.id": {
    "zone": "714e0f2e54a90875426f8a6819f782d0",
    "apitoken": "vOn3NN5HJPut8laSwCjzY-gBO0cxeEdgSLH9WBEH"
  },
  "panelwebsite.biz.id": {
    "zone": "2d6aab40136299392d66eed44a7b1122",
    "apitoken": "CcavVSmQ6ZcGSrTnOos-oXnawq4yf86TUhmQW29S"
  },
  "privatserver.my.id": {
    "zone": "699bb9eb65046a886399c91daacb1968",
    "apitoken": "CcavVSmQ6ZcGSrTnOos-oXnawq4yf86TUhmQW29S"
  },
  "serverku.biz.id": {
    "zone": "4e4feaba70b41ed78295d2dcc090dd3a",
    "apitoken": "CcavVSmQ6ZcGSrTnOos-oXnawq4yf86TUhmQW29S"
  },
  "vipserver.web.id": {
    "zone": "e305b750127749c9b80f41a9cf4a3a53",
    "apitoken": "cpny6vwi620Tfq4vTF4KGjeJIXdUCax3dZArCqnT"
  }, 
  "mypanelstore.web.id": {
    "zone": "c61c442d70392500611499c5af816532",
    "apitoken": "uaw-48Yb5tPqhh5HdhNQSJ6dPA3cauPL_qKkC-Oa"
  }
}


let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`• File update: ${__filename}`);
  delete require.cache[file];
  require(file);
});