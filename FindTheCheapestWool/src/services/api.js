const API_KEY = '5c8c6cda40504c93a664476c82c9691b.udeqRy02vgZtt4oN';
const BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export const chatWithAI = async (messages, records = []) => {
  try {
    const contextPrompt = records.length > 0 
      ? `当前用户正在对比以下方案:\n${records.map(r => `- ${r.name}: 价格¥${r.price}, 数量${r.quantity}, 单价¥${r.unitPrice.toFixed(4)}/${r.unit}`).join('\n')}\n请结合这些数据给出建议。`
      : '目前还没有记录。';

    const systemMessage = {
      role: 'system',
      content: `你是 "WoolMaster 首席精算师"。
角色定位：一位犀利、毒舌但极其实用的消费分析顾问。你看透了商家的套路，眼中只有真实的性价比。
对话风格：
- 拒绝傻白甜式的“情绪价值”，用精准的数据洞察让用户感到爽。
- 说话干脆利落，像华尔街交易员一样分析每一笔交易。
- 偶尔用黑色幽默调侃不划算的方案，用崇拜的语气赞美神价格。
任务：
1. 一针对比列表中的方案，直接点出哪个是【绝对王者】，哪个是【智商税】。
2. 帮用户换算“隐形成本”或“实际获得感”（例如：这这价格相当于白送）。
3. 如果所有方案都不划算，直接建议“别买，立省100%”。

当前上下文：${contextPrompt}`
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [systemMessage, ...messages],
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
      })
    });

    if (!response.ok) {
      throw new Error(`AI 服务异常: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Chat Error:', error);
    return '（小助手好像掉线了...可能在忙着去排队领消费券）' + error.message;
  }
};
