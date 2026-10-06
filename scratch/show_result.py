with open('scratch/dump_perfect_scroll.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'id="perfect-scroll-res">([\s\S]*?)</div>', text)
if m:
    print('FOUND:\n', m.group(1))
else:
    print('Not found')
