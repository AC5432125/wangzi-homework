// API Endpoint for homework grading - Vercel Serverless Function

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, subject, studentName } = req.body;

    if (!image || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompts = {
      '数学': `你是一位资深初中数学老师，正在批改${studentName || '学生'}的数学作业。
请仔细查看作业图片，完成：
1. 识别所有题目并判断对错
2. 给出总分（百分制）
3. 对错题给出详细解题步骤
4. 指出错因（概念/计算/思路）

格式：
📊 得分：XX/100
✅ 正确：题号
❌ 错误：题号
错题解析：[逐题讲解]`,
      '语文': `你是一位资深初中语文老师，正在批改${studentName || '学生'}的语文作业。
评分并给出具体修改建议。

格式：
📝 批改结果
得分：XX/100
优点：[具体优点]
建议：[修改建议]`,
      '英语': `你是一位资深初中英语老师，正在批改${studentName || '学生'}的英语作业。
语法纠错并提供润色版本。

格式：
📝 英语批改
得分：XX/100
语法错误：[具体修改]
润色版本：[修改后文本]`
    };

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
            { type: 'text', text: prompts[subject] || prompts['数学'] },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }],
        max_tokens: 4096,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '批改失败';
    const scoreMatch = content.match(/(\d{1,3})\/100/);
    const score = scoreMatch ? scoreMatch[0] : '批改完成';

    return res.status(200).json({
      score,
      content: content.replace(/\n/g, '<br>'),
      subject,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Grading error:', error);
    return res.status(500).json({
      error: '批改服务暂时不可用',
      details: error.message
    });
  }
}