const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Update .ap-topnav main block
const oldTopnavBlock = `/* Top Navigation Bar (Frosted Glass Navy) */
.ap-topnav {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 18px;
  height: 56px;
  background: #0f1f3d;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  position: relative;
  z-index: 15;
}
.ap-topnav * { color: #ffffff; }

/* Topnav Logo — between hamburger and searchbar */
.ap-topnav-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  height: 38px;
  width: auto;
  min-width: 125px;
  max-width: 135px;
  background: #000000;
  border-radius: 0;
  overflow: hidden;
  box-sizing: border-box;
  padding: 2px 8px;
}
.ap-topnav-logo-img {
  height: 100%;
  max-height: 32px;
  width: 100%;
  max-width: 125px;
  object-fit: contain;
  display: block;
  border-radius: 0 !important;
  transition: opacity 160ms ease;
  transform: none;
}
.ap-topnav-logo:hover .ap-topnav-logo-img {
  opacity: 0.88;
}

.ap-topnav-search {
  flex: 1 1 auto;
  min-width: 200px;
  position: relative;
}
.ap-topnav-search input {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff !important;
  border: 2.4px solid #FF9400 !important;
  border-radius: 10px;
  padding: 8px 14px 8px 36px;
  font-size: 13px;
  font-weight: 600;
  color: #000000 !important;
  outline: none;
  font-family: inherit;
  transition: all 180ms ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.ap-topnav-search input::placeholder {
  color: #64748b !important;
  font-weight: 500;
}
.ap-topnav-search input:focus {
  border-color: #FF9400 !important;
  background: #ffffff !important;
  color: #000000 !important;
  box-shadow: 0 0 0 3px rgba(255, 148, 0, 0.25) !important;
}
.ap-topnav-search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px; height: 15px;
  stroke: #475569 !important; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
  pointer-events: none;
}

/* Real-Time Pulse Indicator */
.ap-topnav-status {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 9999px;
  padding: 4px 14px;
  font-size: 11.5px;
  font-weight: 700;
  color: #34d399 !important;
  white-space: nowrap;
  flex-shrink: 0;
}
.ap-topnav-status-dot {
  width: 7.5px; height: 7.5px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: none !important;
  animation: none !important;
  transition: none !important;
  flex-shrink: 0;
}

.ap-topnav-right {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: 0;
  flex-shrink: 0;
}

/* TOPNAV PROFILE BUTTON AT TOP RIGHT */
.ap-topnav-profile-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid rgba(255, 255, 255, 0.22);
  border-radius: 9999px;
  padding: 4px 12px 4px 5px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #ffffff;
  outline: none;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.ap-topnav-profile-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.ap-topnav-profile-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
}
.ap-topnav-avatar-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid #0f1f3d;
  background: #10b981;
  box-shadow: none !important;
  animation: none !important;
  transition: none !important;
}
.ap-topnav-avatar-dot.offline {
  background: #94a3b8;
}
.ap-topnav-profile-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.2;
}
.ap-topnav-profile-name {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff !important;
  max-width: 95px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ap-topnav-profile-status {
  font-size: 9.5px;
  font-weight: 700;
  color: #34d399 !important;
  letter-spacing: 0.02em;
}
.ap-topnav-profile-status.offline {
  color: #cbd5e1 !important;
}
@media (max-width: 900px) {
  .ap-topnav-profile-btn {
    padding: 4px;
    border-radius: 50%;
  }
}
.ap-topnav-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px; font-weight: 700;
  border: none; cursor: pointer;
  font-family: inherit; white-space: nowrap;
  color: #ffffff !important;
  transition: all 160ms ease;
}
.ap-topnav-btn.primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}
.ap-topnav-btn.primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
.ap-topnav-btn.ghost {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff !important;
}
.ap-topnav-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.16);
}
.ap-topnav-btn svg { width: 13px; height: 13px; stroke: #ffffff; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.ap-topnav-icon-btn {
  width: 34px; height: 34px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 160ms ease;
}
.ap-topnav-icon-btn:hover { background: rgba(255, 255, 255, 0.16); }
.ap-topnav-icon-btn svg { width: 15px; height: 15px; stroke: #ffffff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ap-topnav-notif {
  position: absolute;
  top: 5px; right: 5px;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid var(--ap-nav-bg);
}`;

const newTopnavBlock = `/* Top Navigation Bar (Frosted Glass Navy) */
.ap-topnav {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  height: 68px;
  background: #0f1f3d;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  position: relative;
  z-index: 15;
}
.ap-topnav * { color: #ffffff; }

/* Topnav Logo — between hamburger and searchbar */
.ap-topnav-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  height: 46px;
  width: 86px;
  min-width: 80px;
  max-width: 90px;
  background: #000000;
  border-radius: 0;
  overflow: hidden;
  box-sizing: border-box;
  padding: 2px 5px;
}
.ap-topnav-logo-img {
  height: 100%;
  max-height: 40px;
  width: 100%;
  max-width: 80px;
  object-fit: contain;
  display: block;
  border-radius: 0 !important;
  transition: opacity 160ms ease;
  transform: none;
}
.ap-topnav-logo:hover .ap-topnav-logo-img {
  opacity: 0.88;
}

.ap-topnav-search {
  flex: 1 1 auto;
  min-width: 200px;
  position: relative;
  display: flex;
  align-items: center;
}
.ap-topnav-search input {
  width: 100%;
  height: 44px;
  box-sizing: border-box;
  background: #ffffff !important;
  border: 2.4px solid #FF9400 !important;
  border-radius: 10px;
  padding: 0 16px 0 42px;
  font-size: 13.5px;
  font-weight: 600;
  color: #000000 !important;
  outline: none;
  font-family: inherit;
  transition: all 180ms ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.ap-topnav-search input::placeholder {
  color: #64748b !important;
  font-weight: 500;
}
.ap-topnav-search input:focus {
  border-color: #FF9400 !important;
  background: #ffffff !important;
  color: #000000 !important;
  box-shadow: 0 0 0 3px rgba(255, 148, 0, 0.25) !important;
}
.ap-topnav-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 17px; height: 17px;
  stroke: #475569 !important; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
  pointer-events: none;
}

/* Real-Time Pulse Indicator */
.ap-topnav-status {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  box-sizing: border-box;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 9999px;
  padding: 0 16px;
  font-size: 12.5px;
  font-weight: 700;
  color: #34d399 !important;
  white-space: nowrap;
  flex-shrink: 0;
}
.ap-topnav-status-dot {
  width: 8.5px; height: 8.5px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: none !important;
  animation: none !important;
  transition: none !important;
  flex-shrink: 0;
}

.ap-topnav-right {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: 0;
  flex-shrink: 0;
}

/* TOPNAV PROFILE BUTTON AT TOP RIGHT */
.ap-topnav-profile-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid rgba(255, 255, 255, 0.22);
  border-radius: 9999px;
  padding: 0 14px 0 5px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #ffffff;
  outline: none;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.ap-topnav-profile-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.ap-topnav-profile-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 800;
  flex-shrink: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
}
.ap-topnav-avatar-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid #0f1f3d;
  background: #10b981;
  box-shadow: none !important;
  animation: none !important;
  transition: none !important;
}
.ap-topnav-avatar-dot.offline {
  background: #94a3b8;
}
.ap-topnav-profile-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.25;
}
.ap-topnav-profile-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff !important;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ap-topnav-profile-status {
  font-size: 10px;
  font-weight: 700;
  color: #34d399 !important;
  letter-spacing: 0.02em;
}
.ap-topnav-profile-status.offline {
  color: #cbd5e1 !important;
}
@media (max-width: 900px) {
  .ap-topnav-profile-btn {
    padding: 4px;
    border-radius: 50%;
    height: 42px;
    width: 42px;
    justify-content: center;
  }
}
.ap-topnav-btn {
  display: flex; align-items: center; gap: 7px;
  height: 44px;
  box-sizing: border-box;
  padding: 0 18px;
  border-radius: 9px;
  font-size: 13px; font-weight: 700;
  border: none; cursor: pointer;
  font-family: inherit; white-space: nowrap;
  color: #ffffff !important;
  transition: all 160ms ease;
}
.ap-topnav-btn.primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}
.ap-topnav-btn.primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
.ap-topnav-btn.ghost {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff !important;
}
.ap-topnav-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.16);
}
.ap-topnav-btn svg { width: 15px; height: 15px; stroke: #ffffff; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.ap-topnav-icon-btn {
  width: 44px; height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 160ms ease;
  box-sizing: border-box;
}
.ap-topnav-icon-btn:hover { background: rgba(255, 255, 255, 0.16); }
.ap-topnav-icon-btn svg { width: 18px; height: 18px; stroke: #ffffff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ap-topnav-notif {
  position: absolute;
  top: 8px; right: 8px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #0f1f3d;
}`;

// Helper to replace normalizing CRLF
function safeReplace(source, oldSnippet, newSnippet) {
  const normSource = source.replace(/\r\n/g, '\n');
  const normOld = oldSnippet.replace(/\r\n/g, '\n');
  const normNew = newSnippet.replace(/\r\n/g, '\n');
  
  if (!normSource.includes(normOld)) {
    throw new Error('Snippet not found!');
  }
  
  const updated = normSource.replace(normOld, normNew);
  // Restore original CRLF format
  return updated.replace(/\n/g, '\r\n');
}

css = safeReplace(css, oldTopnavBlock, newTopnavBlock);

// 2. Update hamburger menu button in desktop section
const oldHamburger = `/* -- Desktop hamburger: always visible, toggles sidebar -------- */
.ap-mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 160ms ease, transform 160ms ease;
  outline: none;
}
.ap-mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}
.ap-mobile-menu-btn:active {
  transform: scale(0.93);
}
.ap-mobile-menu-btn svg {
  width: 19px;
  height: 19px;
  stroke: #ffffff;
  stroke-width: 2.2;
  stroke-linecap: round;
  fill: none;
}`;

const newHamburger = `/* -- Desktop hamburger: always visible, toggles sidebar -------- */
.ap-mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 160ms ease, transform 160ms ease;
  outline: none;
  box-sizing: border-box;
}
.ap-mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}
.ap-mobile-menu-btn:active {
  transform: scale(0.93);
}
.ap-mobile-menu-btn svg {
  width: 22px;
  height: 22px;
  stroke: #ffffff;
  stroke-width: 2.2;
  stroke-linecap: round;
  fill: none;
}`;

css = safeReplace(css, oldHamburger, newHamburger);

// 3. Update topnav brand & logo in responsive section
const oldBrandLogo = `/* Topnav brand logo: visible on both desktop & mobile */
.ap-topnav-brand,
.ap-mobile-brand,
.ap-topnav-logo {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 auto !important;
  height: 38px !important;
  width: auto !important;
  min-width: 125px !important;
  max-width: 135px !important;
  background: #000000 !important;
  border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
  border-radius: 0 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  padding: 2px 8px !important;
  margin: 0 !important;
  cursor: pointer !important;
  transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), border-color 160ms ease !important;
}
.ap-topnav-brand:hover,
.ap-mobile-brand:hover,
.ap-topnav-logo:hover {
  transform: scale(1.02) !important;
  border-color: rgba(255, 255, 255, 0.35) !important;
}
.ap-brand-logo-img,
.ap-topnav-logo-img {
  height: 100% !important;
  max-height: 32px !important;
  width: 100% !important;
  max-width: 125px !important;
  object-fit: contain !important;
  display: block !important;
  border-radius: 0 !important;
  cursor: pointer !important;
}`;

const newBrandLogo = `/* Topnav brand logo: visible on both desktop & mobile */
.ap-topnav-brand,
.ap-mobile-brand,
.ap-topnav-logo {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 auto !important;
  height: 46px !important;
  width: 86px !important;
  min-width: 80px !important;
  max-width: 90px !important;
  background: #000000 !important;
  border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
  border-radius: 0 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  padding: 2px 5px !important;
  margin: 0 !important;
  cursor: pointer !important;
  transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), border-color 160ms ease !important;
}
.ap-topnav-brand:hover,
.ap-mobile-brand:hover,
.ap-topnav-logo:hover {
  transform: scale(1.02) !important;
  border-color: rgba(255, 255, 255, 0.35) !important;
}
.ap-brand-logo-img,
.ap-topnav-logo-img {
  height: 100% !important;
  max-height: 40px !important;
  width: 100% !important;
  max-width: 80px !important;
  object-fit: contain !important;
  display: block !important;
  border-radius: 0 !important;
  cursor: pointer !important;
}`;

css = safeReplace(css, oldBrandLogo, newBrandLogo);

// 4. Update mobile media query rules
const oldMobileTopnav = `  /* Top Navigation Bar with Hamburger on Top Left */
  .ap-topnav {
    padding: 10px 14px !important;
    height: auto !important;
    min-height: 56px !important;
    gap: 10px !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    background: #0f1f3d !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35) !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 50 !important;
  }

  /* Hamburger Menu Button */
  .ap-mobile-menu-btn {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    color: #ffffff !important;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 160ms ease;
  }
  .ap-mobile-menu-btn:hover, .ap-mobile-menu-btn:active {
    background: rgba(255, 255, 255, 0.22) !important;
  }
  .ap-mobile-menu-btn svg {
    width: 20px;
    height: 20px;
    stroke: #ffffff !important;
  }

  /* Mobile Brand Pill: Centered in Topnav, Occupying Complete Space of Logo Box */
  .ap-mobile-brand {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex: 0 1 auto !important;
    width: auto !important;
    max-width: 55% !important;
    min-width: 130px !important;
    height: 44px !important;
    margin: 0 auto !important;
    padding: 2px 8px !important;
    cursor: pointer !important;
    text-align: center !important;
    text-decoration: none !important;
    background: #000000 !important;
    border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
    border-radius: 0 !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4) !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    -webkit-tap-highlight-color: transparent !important;
    transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), border-color 160ms ease, box-shadow 160ms ease !important;
  }`;

const newMobileTopnav = `  /* Top Navigation Bar with Hamburger on Top Left */
  .ap-topnav {
    padding: 10px 14px !important;
    height: auto !important;
    min-height: 68px !important;
    gap: 10px !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    background: #0f1f3d !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35) !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 50 !important;
  }

  /* Hamburger Menu Button */
  .ap-mobile-menu-btn {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 44px !important;
    height: 44px !important;
    border-radius: 10px !important;
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    color: #ffffff !important;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 160ms ease;
  }
  .ap-mobile-menu-btn:hover, .ap-mobile-menu-btn:active {
    background: rgba(255, 255, 255, 0.22) !important;
  }
  .ap-mobile-menu-btn svg {
    width: 22px !important;
    height: 22px !important;
    stroke: #ffffff !important;
  }

  /* Mobile Brand Pill: Centered in Topnav, Occupying Complete Space of Logo Box */
  .ap-mobile-brand {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex: 0 1 auto !important;
    width: 86px !important;
    max-width: 90px !important;
    min-width: 80px !important;
    height: 46px !important;
    margin: 0 auto !important;
    padding: 2px 5px !important;
    cursor: pointer !important;
    text-align: center !important;
    text-decoration: none !important;
    background: #000000 !important;
    border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
    border-radius: 0 !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4) !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    -webkit-tap-highlight-color: transparent !important;
    transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), border-color 160ms ease, box-shadow 160ms ease !important;
  }`;

css = safeReplace(css, oldMobileTopnav, newMobileTopnav);

// 5. Update mobile search input height
const oldMobileSearch = `  .ap-topnav-search input {
    width: 100% !important;
    height: 38px !important;
    font-size: 13px !important;
    border-radius: 9px !important;
    box-sizing: border-box !important;
  }`;

const newMobileSearch = `  .ap-topnav-search input {
    width: 100% !important;
    height: 44px !important;
    font-size: 13.5px !important;
    border-radius: 10px !important;
    box-sizing: border-box !important;
  }`;

css = safeReplace(css, oldMobileSearch, newMobileSearch);

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Successfully updated styles.css for topnav height and logo adjustments!');
