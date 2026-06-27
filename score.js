cat > ~/Desktop/gym-app/netlify/functions/score.js << 'EOF'
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const body = JSON.parse(event.body);
    const exercise = body.exercise;
    const category = body.category;
    const frames = body.frames;

    const content = [
      {
        type: 'text',
        text: 'You are an elite strength coach. Analyse these frames from a "' + exercise + '" set (' + category + '). Score form 1-10 and give 2 sentences of specific, direct coaching feedback. Respond ONLY with valid JSON: {"score":<1-10>,"feedback":"<2 sentences>"}'
      }
    ];

    if (frames && frames.length > 0) {
      frames.forEach(function(f) {
        content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: f } });
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{ role: 'user', content: content }]
      })
    });

    const data = await res.json();
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch(err) {
    console.error(err);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: null, feedback: 'Could not analyse form. Try again.' })
    };
  }
};
EOF
