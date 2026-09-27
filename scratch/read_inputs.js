const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:/Users/ashut/.gemini/antigravity-ide/brain/34b68295-cbbc-45f2-9fd1-ec298600d26f/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.step_index >= 5676 && obj.step_index <= 5700) {
        if (obj.thinking && (obj.thinking.includes('three') || obj.thinking.includes('button') || obj.thinking.includes('width') || obj.thinking.includes('image 3'))) {
          console.log(`STEP ${obj.step_index} THINKING: ${obj.thinking}`);
        }
      }
    } catch(e) {}
  }
}
main();
