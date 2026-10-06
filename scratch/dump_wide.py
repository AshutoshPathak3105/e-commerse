import subprocess
import json
import re

with open('scratch/promo_modal_test.html', 'r', encoding='utf-8') as f:
    content = f.read()

inspect_script = """
<script>
window.addEventListener('load', () => {
  const all = document.querySelectorAll('*');
  const items = [];
  all.forEach(el => {
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (el.children.length === 0 && rect.width > 200) {
      items.push({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        width: Math.round(rect.width),
        minWidth: cs.minWidth,
        whiteSpace: cs.whiteSpace,
        text: (el.innerText || el.value || '').slice(0, 30)
      });
    }
  });
  const res = document.createElement('pre');
  res.id = 'wide-elements-result';
  res.textContent = JSON.stringify(items);
  document.body.appendChild(res);
});
</script>
"""

with open('scratch/promo_modal_inspect.html', 'w', encoding='utf-8') as f:
    f.write(content.replace('</body>', inspect_script + '</body>'))

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.run([
    chrome,
    "--headless=new",
    "--disable-gpu",
    "--window-size=375,667",
    "--dump-dom",
    "file:///C:/Users/ashut/Documents/E-Commerse/scratch/promo_modal_inspect.html"
], capture_output=True, text=True, encoding='utf-8')

match = re.search(r'<pre id="wide-elements-result">([\s\S]*?)</pre>', proc.stdout)
if match:
    data = json.loads(match.group(1))
    # Sort by width descending
    data.sort(key=lambda x: x['width'], reverse=True)
    for d in data[:20]:
        print(f"{d['tag']}#{d['id']}.{d['className']}: width={d['width']}, minWidth={d['minWidth']}, text={repr(d['text'])}")
else:
    print("No result found.")
