// Use node-fetch for making HTTP requests in Node.js environment
// You might need to install it: npm install node-fetch
const fetch = require('node-fetch');

// Environment variables for security
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Telegram API endpoint
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

exports.handler = async (event) => {
  // Allow only POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Ensure environment variables are set
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variable');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const data = JSON.parse(event.body);

    // --- Validate input data (basic example) ---
    if (!data.guestName || !data.attendance) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields (guestName, attendance)' }) };
    }

    // --- Format the message for Telegram ---
    const attendanceText = data.attendance === 'yes' ? '✅ Да, приду!' : '❌ Нет, не смогу';
    const drinksText = data.drinks && data.drinks.length > 0
        ? `\n🥤 Напитки: ${data.drinks.join(', ')}`
        : ''; // No drinks preference specified

    const messageText = `🔔 Новый ответ на приглашение:\n\n👤 Имя: ${data.guestName}\n${attendanceText}${drinksText}`;

    // --- Send the message to Telegram ---
    const response = await fetch(TELEGRAM_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: messageText,
        parse_mode: 'Markdown' // Optional: Use Markdown for formatting
      }),
    });

    const telegramResult = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', telegramResult);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to send message to Telegram: ${telegramResult.description || 'Unknown error'}` }),
      };
    }

    // --- Return success response to the frontend ---
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message sent successfully to Telegram' }),
    };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      // Avoid sending detailed internal errors to the client
      body: JSON.stringify({ error: 'Internal Server Error processing the request' }),
    };
  }
}; 