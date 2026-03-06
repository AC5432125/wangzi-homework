// API Endpoint for homework grading
// Deployed as Vercel Serverless Function

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, subject, studentName } = req.body;

    if (!image || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Call Kimi API for grading
    const gradingResult = await callKimiAPI(image, subject, studentName);

    return res.status(200).json(gradingResult);
  } catch (error) {
    console.error('Grading error:', error);
    return res.status(500).json({ 
      error: '批改服务暂时不可用，请稍后重试',
      details: error.message 
    });
  }
}

async function callKimiAPI(imageBase64, subject, studentName) {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  // Build grading prompt based on subject
  const prompts = {
    '数学': `你是一位资深的初中数学老师，正在批改${studentName}同学的数学作业。

请仔细查看作业图片，完成以下任务：
1. 识别所有题目并判断对错
2. 给出总分（百分制）
3. 对每道错题给出详细解题步骤
4. 指出错因（概念/计算/思路）
5. 出1-2道同类练习题巩固

输出格式：
📊 得分：XX/100
✅ 正确：题号
❌ 错误：题号

错题解析：
[逐题讲解]

同类练习：
[新题目]`,

    '语文': `你是一位资深的初中语文老师，正在批改${studentName}同学的语文作业。

如果是作文：
- 从结构、内容、语言三方面评分
- 给出具体修改建议（非模板化）
- 提供修改示例

如果是其他题型：
- 判断对错
- 给出正确答案和解析

输出格式：
📝 批改结果：等级（A+/A/B+/B/C）
得分：XX/100

优点：
[具体优点]

建议：
[具体修改建议]

修改示例：
原句：...
建议改为：...`,

    '英语': `你是一位资深的初中英语老师，正在批改${studentName}同学的英语作业。

如果是作文：
- 语法纠错（指出具体位置和修改）
- 提供润色版本
- 词汇替换建议

如果是其他题型：
- 判断对错
- 给出正确答案和解析

输出格式：
📝 英语批改：等级
得分：XX/100

语法错误：
1. 第X行："..." → "..."

润色版本：
[修改后的完整文本]

词汇建议：
- ... 可以替换为 ...`
  };

  const prompt = prompts[subject] || prompts['数学'];

  const response = await fetch('https://api.kimi.com/coding/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'k2p5',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:image/jpeg;base64,${imageBase64}` 
              } 
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '批改失败';

  // Extract score from content
  const scoreMatch = content.match(/(\d{1,3})\/100/);
  const score = scoreMatch ? scoreMatch[0] : '批改完成';

  return {
    score,
    content: content.replace(/\n/g, '<br>'),
    subject,
    timestamp: new Date().toISOString()
  };
}
