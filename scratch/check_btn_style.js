const fs = require('fs');
const { execSync } = require('child_process');

const html = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <div class="ap-view-actions">
    <button class="ap-btn ghost" id="ap-cms-refresh-btn">Refresh</button>
    <button class="ap-btn primary" id="ap-top-add-quad-btn">Add Card</button>
  </div>
  <script>
    window.onload = () => {
      const b1 = document.getElementById('ap-cms-refresh-btn');
      const s1 = window.getComputedStyle(b1);
      const res = {
        bg: s1.backgroundColor,
        color: s1.color
      };
      const d = document.createElement('div');
      d.id = 'result';
      d.textContent = JSON.stringify(res);
      document.body.appendChild(d);
    };
  </script>
</body>
</html>`;

fs.writeFileSync('scratch/test_btn_color.html', html);
console.log('Written test_btn_color.html');
