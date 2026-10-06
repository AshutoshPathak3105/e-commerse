const fs = require('fs');
const transcript = fs.readFileSync('C:\\Users\\ashut\\.gemini\\antigravity-ide\\brain\\64366c51-af94-43fb-a88b-2ad046398911\\.system_generated\\logs\\transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');
lines.forEach(l => {
  try {
    const obj = JSON.parse(l);
    if (obj.step_index >= 3500 && obj.step_index <= 3604 && obj.type === 'PLANNER_RESPONSE') {
      if (obj.thinking) {
        console.log('--- Step ' + obj.step_index + ' thinking summary:');
        console.log(obj.thinking.slice(0, 400));
      }
    }
  } catch(e) {}
});
