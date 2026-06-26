const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { OpenAI } = require('openai');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

let news = [
  { id: '1', title: 'SpaceX: Новый запуск', content: 'Сегодня Илон Маск запустил ракету...', source: 'TechCrunch', sourceUrl: 'https://techcrunch.com', time: '5 мин назад', priority: 'urgent' },
  { id: '2', title: 'Криптовалюты растут', content: 'Биткоин обновил максимум...', source: 'Reuters', sourceUrl: 'https://reuters.com', time: '1 ч назад', priority: 'normal' }
];

let sources = [{ id: '1', name: 'TechCrunch', url: 'https://techcrunch.com', enabled: true }];
let settings = { tone: 'expert', length: 300, prompt: '' };
let profile = { username: 'Admin', channel: process.env.TELEGRAM_CHANNEL, notificationsEnabled: true };

app.get('/api/news', (req, res) => res.json(news));
app.post('/api/reject', (req, res) => {
  news = news.filter(n => n.id !== req.body.newsId);
  res.json({ success: true });
});

app.post('/api/generate', async (req, res) => {
  const { title, content, source, sourceUrl } = req.body;
  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: `Напиши пост для ТГ. Тема: ${title}. Текст: ${content}. Тон: ${settings.tone}` }]
    });

    const postText = completion.choices[0].message.content;
    const caption = `${postText}\n\n🔗 <a href="${sourceUrl}">Источник: ${source}</a>`;
    const keywords = title.split(' ').slice(0, 2).join(',');

    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      chat_id: process.env.TELEGRAM_CHANNEL,
      photo: `https://loremflickr.com/800/600/${keywords}`,
      caption: caption,
      parse_mode: 'HTML'
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/settings', (req, res) => res.json(settings));
app.post('/api/settings', (req, res) => { settings = {...settings, ...req.body}; res.json({success: true}); });
app.get('/api/profile', (req, res) => res.json(profile));
app.post('/api/profile', (req, res) => { profile = {...profile, ...req.body}; res.json({success: true}); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));