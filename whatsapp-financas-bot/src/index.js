const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const { handleMessage } = require('./commands');
const { startReminders } = require('./reminders');

const AUTH_DIR = process.env.FINANCAS_AUTH_DIR || path.join(__dirname, '..', 'data', 'auth');

// Em servidor remoto (sem tela pra escanear QR code) defina FINANCAS_PHONE_NUMBER
// com o número (DDI+DDD+número, só dígitos, ex: 5511999999999) e o bot mostra um
// código de 8 dígitos pra digitar no WhatsApp: Aparelhos conectados > Conectar
// com número de telefone.
const PAIRING_PHONE_NUMBER = process.env.FINANCAS_PHONE_NUMBER?.replace(/\D/g, '') || null;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  if (PAIRING_PHONE_NUMBER && !sock.authState.creds.registered) {
    try {
      const code = await sock.requestPairingCode(PAIRING_PHONE_NUMBER);
      console.log(
        `\nNo WhatsApp: Aparelhos conectados > Conectar com número de telefone > digite o código: ${code}\n`
      );
    } catch (err) {
      console.error('Falha ao gerar código de pareamento:', err);
    }
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !PAIRING_PHONE_NUMBER) {
      console.log('\nEscaneie o QR code no WhatsApp: Aparelhos conectados > Conectar um aparelho\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(
        'Conexão encerrada.',
        shouldReconnect ? 'Reconectando...' : 'Sessão deslogada — apague a pasta data/auth e rode de novo para gerar um novo QR code.'
      );
      if (shouldReconnect) start();
    } else if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp! Mande "ajuda" no chat pra ver os comandos.');
      startReminders((jid, text) => sock.sendMessage(jid, { text }));
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid || jid === 'status@broadcast' || jid.endsWith('@g.us')) continue;

      const text =
        msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      if (!text) continue;

      let result;
      try {
        result = handleMessage(jid, msg.pushName, text);
      } catch (err) {
        console.error('Erro ao processar mensagem:', err);
        result = { text: '❌ Ocorreu um erro ao processar seu comando. Tente de novo.' };
      }

      if (result) {
        await sock.sendMessage(jid, { text: result.text });
      }
    }
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar o bot:', err);
  process.exit(1);
});
