const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_reviews_header.html');
const outPng375 = path.resolve(__dirname, 'reviews_header_375.png');
const outPng360 = path.resolve(__dirname, 'reviews_header_360.png');
const outPng768 = path.resolve(__dirname, 'reviews_header_768.png');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reviews Header Test</title>
  <link rel="stylesheet" href="../styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      background: #f1f5f9;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }

    .ap-reviews-view-header .ap-view-title {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100% !important;
      gap: 8px !important;
      margin: 0 0 6px 0 !important;
    }

    .ap-reviews-view-header .ap-view-title-text {
      flex: 1 1 auto !important;
      min-width: 0 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      font-size: 18px !important;
      font-weight: 800 !important;
      color: #0f172a !important;
      line-height: 1.2 !important;
    }

    .ap-reviews-view-header #ap-reviews-overall-badge {
      flex-shrink: 0 !important;
      margin-left: auto !important;
      white-space: nowrap !important;
      align-self: center !important;
      font-size: 11.5px !important;
      font-weight: 800 !important;
      padding: 3px 8px !important;
      background: #fef3c7 !important;
      color: #d97706 !important;
      border: 1px solid #fde68a !important;
      border-radius: 6px !important;
    }

    @media (max-width: 768px) {
      .ap-reviews-view-header .ap-view-title {
        gap: 6px !important;
        margin-bottom: 4px !important;
      }

      .ap-reviews-view-header .ap-view-title-text {
        font-size: clamp(12.5px, 3.4vw, 15px) !important;
      }

      .ap-reviews-view-header #ap-reviews-overall-badge {
        font-size: clamp(9px, 2.3vw, 10.5px) !important;
        padding: 2px 6px !important;
      }
    }

    @media (max-width: 480px) {
      .ap-reviews-view-header .ap-view-title-text {
        font-size: clamp(11.5px, 3.2vw, 13px) !important;
      }

      .ap-reviews-view-header #ap-reviews-overall-badge {
        font-size: clamp(8.5px, 2.2vw, 9.5px) !important;
        padding: 2px 5px !important;
      }
    }
  </style>
</head>
<body id="admin-panel-overlay" class="ap-open">
  <div class="ap-main-window" style="background:#fff; border-radius:12px; padding:14px; box-shadow:0 4px 12px rgba(0,0,0,0.05); max-width:1000px; margin:0 auto;">
    
    <div class="ap-view-header ap-reviews-view-header" style="display:flex; flex-direction:column; gap:12px;">
      <div class="ap-view-title-group" style="position:relative; width:100%;">
        <h2 class="ap-view-title">
          <span class="ap-view-title-text">Reviews &amp; Ratings Moderation</span>
          <span class="ap-super-badge" id="ap-reviews-overall-badge">
            4.2 ★ Overall (1908 Reviews)
          </span>
        </h2>
        <p class="ap-view-sub" style="margin:0; font-size:12px; color:#64748b; line-height:1.45;">Review incoming customer feedback, screen for spam or abusive language, and curate authentic marketplace feedback.</p>
      </div>
    </div>

  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');

console.log('Capturing 375px...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=375,600 --screenshot="${outPng375}" "file://${htmlPath}"`);

console.log('Capturing 360px...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=360,600 --screenshot="${outPng360}" "file://${htmlPath}"`);

console.log('Capturing 768px...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=768,600 --screenshot="${outPng768}" "file://${htmlPath}"`);

console.log('Done.');
