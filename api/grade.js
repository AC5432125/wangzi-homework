// Simple API for homework grading

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { image, subject } = req.body;
    if (!image || !subject) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const prompt = `批改${subject}作业，给出得分（XX/100格式）和详细解析。`;

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }],
        max_tokens: 4096
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '批改失败';
    const scoreMatch = content.match(/(\d{1,3})\/100/);

    return res.status(200).json({
      score: scoreMatch ? scoreMatch[0] : '评分中',
      content: content.replace(/\n/g, '<br>'),
      subject
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}