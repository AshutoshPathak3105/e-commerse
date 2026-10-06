const fs = require('fs');
const transcript = fs.readFileSync('C:\\Users\\ashut\\.gemini\\antigravity-ide\\brain\\64366c51-af94-43fb-a88b-2ad046398911\\.system_generated\\logs\\transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');
const userInputs = lines.filter(l => l.includes('"type":"USER_INPUT"'));
console.log('Total user inputs:', userInputs.length);
if (userInputs.length > 0) {
  const last = JSON.parse(userInputs[userInputs.length - 1]);
  console.log('Last user input step_index:', last.step_index);
  console.log('Keys:', Object.keys(last));
  console.log('typeof content:', typeof last.content);
  if (Array.isArray(last.content)) {
    console.log('content array length:', last.content.length);
    last.content.forEach((item, idx) => console.log(idx, typeof item, Object.keys(item), JSON.stringify(item).slice(0, 100)));
  } else {
    console.log('Full content:', last.content);
  }
}

