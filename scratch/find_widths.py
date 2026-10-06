import re

with open('scratch/promo_modal_test.html', 'r', encoding='utf-8') as f:
    html = f.read()

matches = re.findall(r'style="[^"]*"', html)
for m in matches:
    if 'width' in m:
        print(m)
