import subprocess
import json
import re

with open('scratch/promo_modal_test.html', 'r', encoding='utf-8') as f:
    content = f.read()

inspect_script = """
<script>
window.addEventListener('load', () => {
  const all = document.querySelectorAll('*');
  const culprits = [];
  all.forEach(el => {
    // Check elements whose scrollWidth or clientWidth exceeds 350
    if (el.scrollWidth > 355 || el.clientWidth > 355) {
      culprits.push({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        style: el.getAttribute('style') || ''
      });
    }
  });
  const res = document.createElement('pre');
  res.id = 'culprits-result';
  res.textContent = JSON.stringify(culprits);
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

match = re.search(r'<pre id="culprits-result">([\s\S]*?)</pre>', proc.stdout)
if match:
    data = json.loads(match.group(1))
    print(f"Total elements > 355px: {len(data)}")
    for d in data:
        # print only innermost
        if d['tag'] not in ['HTML', 'BODY', 'DIV']:
            print(d)
        elif d['id'] or 'grid' in d['style'] or 'grid' in d['className']:
            print(d)
else:
    print("No result found.")
