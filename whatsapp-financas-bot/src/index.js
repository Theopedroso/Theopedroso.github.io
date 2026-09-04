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

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
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
