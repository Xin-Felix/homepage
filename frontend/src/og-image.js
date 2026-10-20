import { Resvg } from '@resvg/resvg-js';

/**
 * 生成 1200×630 Open Graph PNG。使用容器内 Noto CJK 字体，避免调用第三方制图服务。
 */
export function createOgImage({ title, description, kicker = 'HUANGXIN.WORK' }) {
  const lines = wrapText(String(title || ''), 16, 3);
  const subtitle = truncate(String(description || ''), 48);
  if (lines.length > 1 && [...lines.at(-1)].length < 4) {
    const previous = [...lines.at(-2)];
    const move = Math.min(4 - [...lines.at(-1)].length, Math.max(0, previous.length - 8));
    if (move > 0) {
      lines[lines.length - 1] = previous.splice(previous.length - move).join('') + lines.at(-1);
      lines[lines.length - 2] = previous.join('');
    }
  }
  const titleSpans = lines.map((line, index) =>
    `<tspan x="78" dy="${index === 0 ? 0 : 84}">${escapeXml(line)}</tspan>`).join('');
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
        <path d="M42 0H0V42" fill="none" stroke="#303638" stroke-width="1"/>
      </pattern>
      <radialGradient id="glow" cx="85%" cy="15%" r="70%">
        <stop offset="0" stop-color="#c9ff4a" stop-opacity=".17"/><stop offset="1" stop-color="#0b0d0f" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" rx="32" fill="#0b0d0f"/>
    <rect x="28" y="28" width="1144" height="574" rx="26" fill="#171b1d" stroke="#363d3f"/>
    <rect x="28" y="28" width="1144" height="574" rx="26" fill="url(#grid)" opacity=".45"/>
    <rect x="28" y="28" width="1144" height="574" rx="26" fill="url(#glow)"/>
    <rect x="78" y="70" width="68" height="68" rx="18" fill="#c9ff4a"/>
    <text x="112" y="113" text-anchor="middle" font-family="Noto Sans CJK SC, sans-serif" font-size="21" font-weight="900" fill="#172000">HX</text>
    <text x="166" y="98" font-family="Noto Sans CJK SC, sans-serif" font-size="16" font-weight="700" letter-spacing="3" fill="#98a19e">${escapeXml(kicker)}</text>
    <text x="78" y="240" font-family="Noto Sans CJK SC, sans-serif" font-size="68" font-weight="800" fill="#f2efe8">${titleSpans}</text>
    <text x="78" y="530" font-family="Noto Sans CJK SC, sans-serif" font-size="22" fill="#98a19e">${escapeXml(subtitle)}</text>
    <circle cx="1082" cy="112" r="42" fill="none" stroke="#c9ff4a" stroke-width="2"/>
    <circle cx="1082" cy="112" r="10" fill="#c9ff4a"/>
    <text x="1082" y="570" text-anchor="end" font-family="monospace" font-size="15" letter-spacing="2" fill="#c9ff4a">BUILD · SHIP · LEARN</text>
  </svg>`;
  const renderer = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true, defaultFontFamily: 'Noto Sans CJK SC' },
  });
  return renderer.render().asPng();
}

function wrapText(value, maxUnits, maxLines) {
  const chars = [...value.trim()];
  const lines = [];
  let current = '';
  let units = 0;
  for (const char of chars) {
    const weight = /[\u0000-\u00ff]/.test(char) ? .58 : 1;
    if (units + weight > maxUnits && current) {
      lines.push(current);
      current = '';
      units = 0;
      if (lines.length === maxLines - 1) break;
    }
    current += char;
    units += weight;
  }
  const consumed = lines.join('').length + current.length;
  if (consumed < chars.length) current = current.replace(/[，。；：、,.!?\s]*$/, '') + '…';
  if (current) lines.push(current);
  return lines.length ? lines : ['HUANGXIN.WORK'];
}

function truncate(value, max) {
  const chars = [...value.replace(/\s+/g, ' ').trim()];
  return chars.length > max ? chars.slice(0, max).join('') + '…' : chars.join('');
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, char => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  }[char]));
}
