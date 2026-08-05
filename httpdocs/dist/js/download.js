/**
 * Download page logic for freemocap.org/download.
 *
 * Ported from the FreeMoCap docs site's React download page
 * (freemocap/freemocap, freemocap-docs/src/components/download/). Detects
 * the visitor's OS/GPU, fetches live release data from the GitHub API, and
 * renders OS-specific installer/server downloads with install instructions.
 * No build step - single classic script, matching nav.js's convention.
 */
(async function initDownloadPage() {
  // ── data ─────────────────────────────────────────────────
  const REPO = 'freemocap/freemocap';
  const DEFAULT_VERSION = '2.0.0-alpha.6';
  const R2_PUBLIC_URL = 'https://pub-0a275a10417e425c94e48de393793129.r2.dev';

  function getReleaseBaseUrl(version) {
    return `https://github.com/${REPO}/releases/download/v${version}`;
  }

  function getR2BaseUrl(version) {
    return `${R2_PUBLIC_URL}/releases/v${version}`;
  }

  // Only the Linux CUDA build exceeds GitHub's 2GB per-asset limit, so it
  // alone is hosted on R2. Mirrors build-installers-pyinstaller.yml.
  function isR2Hosted(os, variant) {
    return os === 'linux' && variant === 'cuda';
  }

  function downloadUrl(file, os, version, variant) {
    const base = isR2Hosted(os, variant) ? getR2BaseUrl(version) : getReleaseBaseUrl(version);
    return `${base}/${file}`;
  }

  function buildAppDownloads(version) {
    return [
      { os: 'windows', arch: 'x64', variant: 'cuda', fmt: 'exe', recommended: true, label: 'Windows Installer (GPU · CUDA)', file: `freemocap_${version}_windows-x64-cuda.exe`, size: '' },
      { os: 'windows', arch: 'x64', variant: 'cpu', fmt: 'exe', recommended: true, label: 'Windows Installer (CPU-only)', file: `freemocap_${version}_windows-x64-cpu.exe`, size: '' },
      { os: 'macos', arch: 'arm64', fmt: 'dmg', recommended: true, label: 'macOS Installer (Apple Silicon)', file: `freemocap_${version}_macos-arm64-apple-silicon.dmg`, size: '' },
      { os: 'macos', arch: 'arm64', fmt: 'zip', recommended: false, label: 'macOS Portable (Apple Silicon)', file: `freemocap_${version}_macos-arm64-apple-silicon.zip`, size: '' },
      { os: 'linux', arch: 'x64', variant: 'cuda', fmt: 'AppImage', recommended: true, label: 'Linux AppImage (GPU · CUDA)', file: `freemocap_${version}_linux-x64-cuda.AppImage`, size: '' },
      { os: 'linux', arch: 'x64', variant: 'cuda', fmt: 'deb', recommended: false, label: 'Linux .deb (GPU · CUDA)', file: `freemocap_${version}_linux-x64-cuda.deb`, size: '' },
      { os: 'linux', arch: 'x64', variant: 'cpu', fmt: 'AppImage', recommended: true, label: 'Linux AppImage (CPU-only)', file: `freemocap_${version}_linux-x64-cpu.AppImage`, size: '' },
      { os: 'linux', arch: 'x64', variant: 'cpu', fmt: 'deb', recommended: false, label: 'Linux .deb (CPU-only)', file: `freemocap_${version}_linux-x64-cpu.deb`, size: '' },
    ];
  }

  function buildServerDownloads(version) {
    return [
      { os: 'windows', arch: 'x64', variant: 'cuda', fmt: 'zip', recommended: false, label: 'Server — Windows x64 (CUDA)', file: `freemocap_server_${version}_windows-x64-cuda.zip`, size: '' },
      { os: 'windows', arch: 'x64', variant: 'cpu', fmt: 'zip', recommended: false, label: 'Server — Windows x64 (CPU)', file: `freemocap_server_${version}_windows-x64-cpu.zip`, size: '' },
      { os: 'macos', arch: 'arm64', fmt: 'zip', recommended: false, label: 'Server — macOS Apple Silicon', file: `freemocap_server_${version}_macos-arm64-apple-silicon.zip`, size: '' },
      { os: 'linux', arch: 'x64', variant: 'cuda', fmt: 'zip', recommended: false, label: 'Server — Linux x64 (CUDA)', file: `freemocap_server_${version}_linux-x64-cuda.zip`, size: '' },
      { os: 'linux', arch: 'x64', variant: 'cpu', fmt: 'zip', recommended: false, label: 'Server — Linux x64 (CPU)', file: `freemocap_server_${version}_linux-x64-cpu.zip`, size: '' },
    ];
  }

  function formatBytes(bytes) {
    const mb = bytes / (1024 * 1024);
    return `~${Math.round(mb)} MB`;
  }

  function enrichDownloadsWithAssets(downloads, assets) {
    const assetMap = new Map(assets.map(a => [a.name, a]));
    return downloads.map(d => {
      const asset = assetMap.get(d.file);
      return asset ? Object.assign({}, d, { size: formatBytes(asset.size) }) : d;
    });
  }

  function enrichDownloadsWithR2Sizes(downloads, version, sizeByUrl) {
    return downloads.map(d => {
      if (!isR2Hosted(d.os, d.variant)) return d;
      const size = sizeByUrl[downloadUrl(d.file, d.os, version, d.variant)];
      return size != null ? Object.assign({}, d, { size: formatBytes(size) }) : d;
    });
  }

  function matchesExpectedPattern(assets, version) {
    const expectedFiles = [...buildAppDownloads(version).map(d => d.file), ...buildServerDownloads(version).map(d => d.file)];
    const assetNames = new Set(assets.map(a => a.name));
    return expectedFiles.filter(f => assetNames.has(f)).length >= 3;
  }

  function hasVariant(os, arch) {
    return (os === 'windows' || os === 'linux') && arch === 'x64';
  }

  function fileLabel(os, arch, variant) {
    if (os === 'macos') return 'macos-arm64-apple-silicon';
    const base = os === 'linux' ? 'linux-x64' : 'windows-x64';
    return variant ? `${base}-${variant}` : base;
  }

  function formatMeta(d) {
    const parts = [d.fmt.toUpperCase()];
    if (d.os !== 'windows') parts.push(d.arch === 'arm64' ? 'ARM64' : 'x64');
    return parts.join(' · ');
  }

  const OS_LABELS = { windows: 'Windows x64', macos: 'macOS', linux: 'Linux', unknown: 'Unknown OS' };

  function archLabel(arch) {
    return arch === 'arm64' ? 'ARM64 / Apple Silicon' : 'x64 / Intel';
  }

  function stripVersionPrefix(tag) {
    return tag.replace(/^v/, '');
  }

  const OS_NOTES = [
    {
      os: 'macos', arch: 'x64', variant: 'warning',
      title: 'Intel Mac builds aren’t available yet',
      content: 'FreeMoCap’s pose-tracking backend (onnxruntime, via skellytracker) doesn’t currently publish a macOS x86_64 wheel, so we can’t build for Intel Macs yet. If you’re on Apple Silicon, select that option above instead.',
      issues: [{ label: 'Add macOS Intel (x86_64) installer build', url: 'https://github.com/freemocap/freemocap/issues/823' }],
    },
    {
      os: 'linux', arch: 'arm64', variant: 'warning',
      title: 'Linux ARM64 builds aren’t available',
      content: 'We can’t build a Linux ARM64 release (e.g. for Raspberry Pi) yet: mediapipe — a core dependency of the pose-tracking backend — ships no linux-aarch64 wheel, so the build is unsatisfiable on that platform. It’ll stay unavailable until mediapipe publishes ARM64 Linux wheels.',
      issues: [{ label: 'Add Linux ARM64 installer build', url: 'https://github.com/freemocap/freemocap/issues/822' }],
    },
  ];

  // ── install instructions ────────────────────────────────
  function getAppInstallInstructions(os, arch, variant, version) {
    if (os === 'windows') {
      return [{ text: 'Download and run the <code>.exe</code> installer. If Windows SmartScreen appears, click <strong>"More info"</strong> → <strong>"Run anyway"</strong>.' }];
    }
    if (os === 'macos') {
      return [
        { text: '<strong>.dmg</strong> — Open the disk image and drag FreeMoCap into Applications. On first launch, right-click the app and select <strong>Open</strong> to bypass Gatekeeper.' },
        { text: '<strong>.zip</strong> — Portable version. Unzip and double-click to run without installing.' },
      ];
    }
    if (os === 'linux') {
      const label = fileLabel(os, arch, variant);
      const ai = `freemocap_${version}_${label}.AppImage`;
      const deb = `freemocap_${version}_${label}.deb`;
      return [
        { text: '<strong>AppImage</strong> — Portable, works on any distro. Download, make executable, and run. No root needed.' },
        { codeLines: [
          { type: 'prompt', content: `chmod +x ${ai}`, promptChar: '$' },
          { type: 'prompt', content: `./${ai}`, promptChar: '$' },
        ] },
        { text: '<strong>.deb</strong> — For Debian, Ubuntu, Pop!_OS, and similar. Installs system-wide with desktop integration.' },
        { codeLines: [{ type: 'prompt', content: `sudo apt install ./${deb}`, promptChar: '$' }] },
      ];
    }
    return [];
  }

  function getServerInstallInstructions(os, arch, variant, version) {
    const label = fileLabel(os, arch, variant);
    const zip = `freemocap_server_${version}_${label}.zip`;
    const bin = os === 'windows' ? 'freemocap_server.exe' : 'freemocap_server';

    if (os === 'windows') {
      return [
        { text: 'Download the <code>.zip</code>, extract it, then run the server from inside the extracted folder — it needs its bundled support files alongside it. Starts a local API on port <code>53117</code>.' },
        { codeLines: [
          { type: 'prompt', content: `Expand-Archive ${zip} -DestinationPath freemocap_server`, promptChar: '>' },
          { type: 'prompt', content: 'cd freemocap_server', promptChar: '>' },
          { type: 'prompt', content: `.\\${bin}`, promptChar: '>' },
        ] },
      ];
    }
    if (os === 'macos') {
      return [
        { text: 'Download the <code>.zip</code>, extract it, then make the binary executable and run it from Terminal — it needs its bundled support files alongside it.' },
        { codeLines: [
          { type: 'prompt', content: `unzip ${zip} -d freemocap_server`, promptChar: '$' },
          { type: 'prompt', content: 'cd freemocap_server', promptChar: '$' },
          { type: 'prompt', content: `chmod +x ${bin}`, promptChar: '$' },
          { type: 'prompt', content: `xattr -cr ${bin}`, promptChar: '$' },
          { type: 'prompt', content: `./${bin}`, promptChar: '$' },
        ] },
        { text: 'The <code>xattr</code> command clears the macOS quarantine flag so Gatekeeper won’t block it.' },
      ];
    }
    if (os === 'linux') {
      return [
        { text: 'Download the <code>.zip</code>, extract it, then make the binary executable and run it — it needs its bundled support files alongside it. Ideal for headless rigs and remote capture machines.' },
        { codeLines: [
          { type: 'prompt', content: `unzip ${zip} -d freemocap_server`, promptChar: '$' },
          { type: 'prompt', content: 'cd freemocap_server', promptChar: '$' },
          { type: 'prompt', content: `chmod +x ${bin}`, promptChar: '$' },
          { type: 'prompt', content: `./${bin}`, promptChar: '$' },
          { type: 'text', content: '' },
          { type: 'comment', content: '# Or run in background (survives terminal close)' },
          { type: 'prompt', content: `nohup ./${bin} &`, promptChar: '$' },
        ] },
      ];
    }
    return [];
  }

  function getTerminalInstallBlocks(os, arch, variant, version) {
    if (os !== 'linux' && os !== 'macos') return [];
    const label = fileLabel(os, arch, variant);
    const srvZip = `freemocap_server_${version}_${label}.zip`;
    const blocks = [];

    if (os === 'linux') {
      const ai = `freemocap_${version}_${label}.AppImage`;
      const deb = `freemocap_${version}_${label}.deb`;
      blocks.push({ codeLines: [
        { type: 'comment', content: '# App Installer — AppImage (any distro, no root)' },
        { type: 'prompt', content: `curl -fSL -o freemocap.AppImage "${downloadUrl(ai, os, version, variant)}"`, promptChar: '$' },
        { type: 'prompt', content: 'chmod +x freemocap.AppImage', promptChar: '$' },
        { type: 'prompt', content: './freemocap.AppImage', promptChar: '$' },
      ] });
      blocks.push({ codeLines: [
        { type: 'comment', content: '# App Installer — .deb (Debian/Ubuntu)' },
        { type: 'prompt', content: `curl -fSL -o freemocap.deb "${downloadUrl(deb, os, version, variant)}"`, promptChar: '$' },
        { type: 'prompt', content: 'sudo apt install ./freemocap.deb', promptChar: '$' },
      ] });
      blocks.push({ codeLines: [
        { type: 'comment', content: '# Backend Server (headless / remote capture)' },
        { type: 'prompt', content: `curl -fSL -o freemocap_server.zip "${downloadUrl(srvZip, os, version, variant)}"`, promptChar: '$' },
        { type: 'prompt', content: 'unzip freemocap_server.zip -d freemocap_server && cd freemocap_server', promptChar: '$' },
        { type: 'prompt', content: 'chmod +x freemocap_server', promptChar: '$' },
        { type: 'prompt', content: './freemocap_server', promptChar: '$' },
      ] });
    }

    if (os === 'macos') {
      const dmg = `freemocap_${version}_${label}.dmg`;
      blocks.push({ codeLines: [
        { type: 'comment', content: '# App Installer' },
        { type: 'prompt', content: `curl -fSL -o freemocap.dmg "${downloadUrl(dmg, os, version, variant)}"`, promptChar: '$' },
        { type: 'prompt', content: 'open freemocap.dmg', promptChar: '$' },
      ] });
      blocks.push({ codeLines: [
        { type: 'comment', content: '# Backend Server' },
        { type: 'prompt', content: `curl -fSL -o freemocap_server.zip "${downloadUrl(srvZip, os, version, variant)}"`, promptChar: '$' },
        { type: 'prompt', content: 'unzip freemocap_server.zip -d freemocap_server && cd freemocap_server', promptChar: '$' },
        { type: 'prompt', content: 'chmod +x freemocap_server && xattr -cr freemocap_server', promptChar: '$' },
        { type: 'prompt', content: './freemocap_server', promptChar: '$' },
      ] });
    }

    return blocks;
  }

  function getTerminalTipContent(os) {
    if (os === 'windows') {
      return { openHow: 'Press <code>Win + X</code> then choose <strong>Terminal</strong>, or search for <strong>"PowerShell"</strong> in the Start menu.', promptChar: '<code>&gt;</code>' };
    }
    if (os === 'macos') {
      return { openHow: 'Open <strong>Terminal</strong> from <strong>Applications → Utilities → Terminal</strong>, or press <code>Cmd + Space</code> and type <strong>"Terminal"</strong>.', promptChar: '<code>$</code>' };
    }
    return { openHow: 'Open your terminal emulator. On most desktops, press <code>Ctrl + Alt + T</code> or find <strong>"Terminal"</strong> in your application launcher.', promptChar: '<code>$</code>' };
  }

  // ── detection ────────────────────────────────────────────
  function detectSystem() {
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator.platform || '').toLowerCase();

    let os = 'unknown';
    if (ua.includes('win')) os = 'windows';
    else if (ua.includes('mac')) os = 'macos';
    else if (ua.includes('linux') || ua.includes('x11')) os = 'linux';

    let arch = 'x64';
    if (ua.includes('arm64') || ua.includes('aarch64') || platform.includes('arm')) {
      arch = 'arm64';
    }

    if (os === 'macos') {
      try {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (/Apple\s+(M[1-9]|GPU)/.test(renderer)) arch = 'arm64';
          }
        }
      } catch (_) { /* ignore */ }
    }

    return { os, arch };
  }

  function refineMacArch(onRefined) {
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      navigator.userAgentData.getHighEntropyValues(['architecture'])
        .then(v => { if (v.architecture === 'arm') onRefined('arm64'); })
        .catch(() => {});
    }
  }

  function detectGpu() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (typeof renderer === 'string' && /NVIDIA/i.test(renderer)) {
            return { variant: 'cuda', detected: true };
          }
        }
      }
    } catch (_) { /* ignore */ }
    return { variant: 'cpu', detected: false };
  }

  // ── fetch + cache ────────────────────────────────────────
  function readSessionCache(key, ttl) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.timestamp > ttl) {
        sessionStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch (_) { return null; }
  }

  function writeSessionCache(key, data) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (_) { /* full or unavailable */ }
  }

  const RELEASES_CACHE_KEY = 'freemocap-releases';
  const RELEASES_CACHE_TTL_MS = 10 * 60 * 1000;

  async function fetchReleases() {
    const cached = readSessionCache(RELEASES_CACHE_KEY, RELEASES_CACHE_TTL_MS);
    if (cached) return cached;
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    writeSessionCache(RELEASES_CACHE_KEY, data);
    return data;
  }

  const R2_SIZES_CACHE_KEY = 'freemocap-r2-sizes';
  const R2_SIZES_CACHE_TTL_MS = 60 * 60 * 1000;

  async function fetchR2Sizes(urls) {
    if (urls.length === 0) return {};
    const cached = readSessionCache(R2_SIZES_CACHE_KEY, R2_SIZES_CACHE_TTL_MS) || {};
    const missing = urls.filter(u => cached[u] == null);
    if (missing.length === 0) return cached;

    const results = await Promise.all(missing.map(async url => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        const len = res.headers.get('content-length');
        return len ? [url, Number(len)] : null;
      } catch (_) { return null; }
    }));

    const merged = Object.assign({}, cached);
    results.forEach(r => { if (r) merged[r[0]] = r[1]; });
    writeSessionCache(R2_SIZES_CACHE_KEY, merged);
    return merged;
  }

  const ISSUE_CACHE_TTL_MS = 5 * 60 * 1000;

  function parseIssueUrl(url) {
    try {
      const u = new URL(url);
      const match = u.pathname.match(/^\/([^/]+\/[^/]+)\/(?:issues|pull)\/(\d+)/);
      if (!match) return null;
      return { repo: match[1], number: Number.parseInt(match[2], 10) };
    } catch (_) { return null; }
  }

  async function fetchIssueMetadata(url) {
    const cacheKey = `sk-linked-${url}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < ISSUE_CACHE_TTL_MS) return parsed.data;
      }
    } catch (_) { /* ignore */ }

    const parsedUrl = parseIssueUrl(url);
    if (!parsedUrl) return null;

    try {
      const resp = await fetch(`https://api.github.com/repos/${parsedUrl.repo}/issues/${parsedUrl.number}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (!resp.ok) return null;
      const raw = await resp.json();
      const labels = (raw.labels || []).map(l => ({ name: l.name, color: l.color })).filter(l => l.name !== 'roadmap');
      const data = { status: raw.state === 'open' ? 'open' : 'closed', type: raw.pull_request ? 'pr' : 'issue', labels };
      try { localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data })); } catch (_) { /* full or unavailable */ }
      return data;
    } catch (_) {
      return null;
    }
  }

  // ── render helpers ───────────────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function renderCard(d, variant, version) {
    const cardClasses = ['dl-card'];
    if (variant === 'recommended') cardClasses.push('dl-card-recommended');
    if (variant === 'server-rec') cardClasses.push('dl-card-server-rec');

    const btnClass = variant === 'recommended' ? 'dl-card-btn-primary' : variant === 'server-rec' ? 'dl-card-btn-server' : 'dl-card-btn-secondary';
    const badgeClass = variant === 'recommended' ? 'dl-badge-rec' : variant === 'server-rec' ? 'dl-badge-server' : null;
    const badgeText = variant === 'recommended' ? 'recommended' : variant === 'server-rec' ? 'your system' : null;
    const url = downloadUrl(d.file, d.os, version, d.variant);

    return `
      <a href="${escapeHtml(url)}" class="${cardClasses.join(' ')}">
        <div class="dl-card-info">
          <div class="dl-card-name">
            ${escapeHtml(d.label)}
            ${badgeClass ? `<span class="dl-badge ${badgeClass}">${badgeText}</span>` : ''}
          </div>
          <div class="dl-card-meta">${escapeHtml(formatMeta(d))}</div>
        </div>
        <div class="dl-card-right">
          ${d.size ? `<span class="dl-card-size">${escapeHtml(d.size)}</span>` : ''}
          <span class="dl-card-btn ${btnClass}">Download</span>
        </div>
      </a>
    `;
  }

  function renderCodeBlock(lines) {
    const commands = lines.filter(l => l.type === 'prompt').map(l => l.content).join('\n');
    const body = lines.map(line => {
      if (line.type === 'comment') return `<span class="dl-comment">${escapeHtml(line.content)}</span>\n`;
      if (line.type === 'prompt') return `<span class="dl-prompt">${escapeHtml(line.promptChar || '$')}</span> ${escapeHtml(line.content)}\n`;
      return `${escapeHtml(line.content)}\n`;
    }).join('');
    return '<div class="dl-code-block"><button type="button" class="dl-copy-btn" data-copy="' + escapeHtml(commands) + '">Copy</button>' + body + '</div>';
  }

  function renderTerminalTip(os) {
    const t = getTerminalTipContent(os);
    return `
      <details class="dl-details dl-terminal-tip">
        <summary class="dl-toggle dl-toggle-terminal-tip"><span class="dl-arrow">&#9654;</span> New to the terminal?</summary>
        <div class="dl-terminal-tip-content">
          <p>${t.openHow}</p>
          <p>The ${t.promptChar} symbol shown before each command is the <strong>prompt</strong> — it means “type here.” Don’t type it yourself; just type the text that comes after it, then press <strong>Enter</strong>.</p>
          <p>The <strong>Copy</strong> button in the top-right of each code block copies only the commands (without the prompt), ready to paste.</p>
        </div>
      </details>
    `;
  }

  function renderOsNote(note, idx) {
    const variantClass = note.variant === 'warning' ? 'dl-os-note-warning' : note.variant === 'info' ? 'dl-os-note-info' : '';
    const icon = note.variant === 'warning' ? '⚠️' : note.variant === 'info' ? 'ℹ️' : '💡';
    const issuesHtml = (note.issues && note.issues.length > 0) ? `
      <details class="dl-linked-issues" data-note-index="${idx}">
        <summary class="dl-linked-issues-toggle"><span class="dl-arrow">&#9654;</span> Linked Issues <span class="dl-linked-issues-count">${note.issues.length}</span></summary>
        <div class="dl-linked-issues-items"></div>
      </details>
    ` : '';

    return `
      <div class="dl-os-note ${variantClass}">
        <span class="dl-os-note-icon">${icon}</span>
        <div class="dl-os-note-content">
          <div class="dl-os-note-title">${note.title}</div>
          <p>${note.content}</p>
          ${issuesHtml}
        </div>
      </div>
    `;
  }

  function renderLinkedIssueItem(item) {
    const typeBadge = item.type ? `<span class="dl-issue-type-badge">${item.type === 'pr' ? 'PR' : 'Issue'}</span>` : '';
    const statusBadge = item.status
      ? `<span class="dl-issue-status ${item.status === 'open' ? 'dl-issue-status-open' : 'dl-issue-status-closed'}">${item.status === 'open' ? '●' : '✓'}</span>`
      : '';
    const chips = (item.labels || []).map(l => {
      const c = escapeHtml(l.color);
      return `<span class="dl-issue-label-chip" style="color:#${c};background:#${c}26;border-color:#${c}73;">${escapeHtml(l.name)}</span>`;
    }).join('');

    return `
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="dl-linked-issue-item">
        ${typeBadge}${statusBadge}
        <span>&#9671; ${escapeHtml(item.label)}</span>
        ${chips}
        <span class="dl-linked-issue-arrow">&#8599;</span>
      </a>
    `;
  }

  function wireLinkedIssues(container, notes) {
    container.querySelectorAll('.dl-linked-issues').forEach(detailsEl => {
      const idx = Number(detailsEl.dataset.noteIndex);
      const note = notes[idx];
      if (!note) return;
      let loaded = false;
      detailsEl.addEventListener('toggle', () => {
        if (!detailsEl.open || loaded) return;
        loaded = true;
        const itemsEl = detailsEl.querySelector('.dl-linked-issues-items');
        itemsEl.innerHTML = '<div class="dl-linked-issue-loading">Loading&hellip;</div>';
        Promise.all(note.issues.map(async issue => {
          const meta = await fetchIssueMetadata(issue.url);
          return Object.assign({}, issue, meta || {});
        })).then(enriched => {
          itemsEl.innerHTML = enriched.map(renderLinkedIssueItem).join('');
        });
      });
    });
  }

  function wireCopyButtons(container) {
    container.querySelectorAll('.dl-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copy || '').then(() => {
          btn.textContent = 'Copied!';
          btn.classList.add('dl-copy-btn-copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('dl-copy-btn-copied');
          }, 2000);
        }, () => {
          btn.textContent = 'Copy failed';
          setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
        });
      });
    });
  }

  function renderDownloadSection(opts) {
    const blockClass = opts.sectionVariant === 'primary' ? 'dl-section-block' : 'dl-section-block dl-section-block-secondary';
    const cardVariant = opts.sectionVariant === 'primary' ? 'recommended' : 'server-rec';
    const notesHtml = (opts.notes || []).map((n, i) => renderOsNote(n, opts.notesStartIndex + i)).join('');

    const downloadsHtml = (opts.recommended.length === 0 && opts.noDetectMessage)
      ? `<div class="dl-no-detect">${escapeHtml(opts.noDetectMessage)}</div>`
      : opts.recommended.map(d => renderCard(d, cardVariant, opts.version)).join('');

    const alternatesHtml = (opts.alternates && opts.alternates.length > 0) ? `
      <div class="dl-alt-format-label">Also available for your system:</div>
      <div class="dl-downloads">${opts.alternates.map(d => renderCard(d, 'secondary', opts.version)).join('')}</div>
    ` : '';

    let instructionsHtml = '';
    if (opts.installInstructions.length > 0) {
      const blocksHtml = opts.installInstructions.map(block => block.codeLines ? renderCodeBlock(block.codeLines) : `<p>${block.text}</p>`).join('');
      const tipHtml = (opts.showTerminalTip && opts.terminalTipOs) ? renderTerminalTip(opts.terminalTipOs) : '';
      instructionsHtml = `
        <details class="dl-details">
          <summary class="dl-toggle"><span class="dl-arrow">&#9654;</span> Install instructions</summary>
          <div class="dl-section-details-content">${blocksHtml}${tipHtml}</div>
        </details>
      `;
    }

    const headerBodyHtml = opts.leadHtml
      ? `<p class="dl-section-lead">${opts.leadHtml}</p>`
      : `
        <div class="dl-section-subtitle">${opts.subtitleHtml}</div>
        <details class="dl-details">
          <summary class="dl-toggle"><span class="dl-arrow">&#9654;</span> ${escapeHtml(opts.detailsLabel)}</summary>
          <div class="dl-section-details-content">${opts.detailsContentHtml}</div>
        </details>
      `;

    return `
      <div class="${blockClass}">
        <div class="dl-section-header">
          <div class="dl-section-title">${opts.icon ? `<span class="dl-section-title-icon">${opts.icon}</span> ` : ''}${escapeHtml(opts.title)}</div>
          ${headerBodyHtml}
        </div>
        ${notesHtml}
        <div class="dl-downloads">${downloadsHtml}</div>
        ${alternatesHtml}
        ${instructionsHtml}
        ${opts.terminalInstallHtml || ''}
      </div>
    `;
  }

  function renderTerminalInstallSection(os, arch, variant, version) {
    if (os === 'windows' || os === 'unknown') return '';
    const blocks = getTerminalInstallBlocks(os, arch, variant, version);
    if (blocks.length === 0) return '';
    const blocksHtml = blocks.map(b => b.codeLines ? renderCodeBlock(b.codeLines) : '').join('');
    return `
      <details class="dl-details">
        <summary class="dl-toggle"><span class="dl-arrow">&#9654;</span> Install from terminal</summary>
        <div class="dl-section-label" style="margin-top:8px">One-liner install from terminal</div>
        <p class="dl-install-hint">Download and run directly using <code>curl</code>.</p>
        ${blocksHtml}
        ${renderTerminalTip(os)}
      </details>
    `;
  }

  function renderAllPlatformsSection(otherApp, otherServer, version, defaultOpen) {
    if (otherApp.length === 0 && otherServer.length === 0) return '';
    const appHtml = otherApp.length > 0 ? `
      <div class="dl-section-label" style="margin-top:8px">App Installer — other platforms</div>
      <div class="dl-downloads">${otherApp.map(d => renderCard(d, 'secondary', version)).join('')}</div>
    ` : '';
    const serverHtml = otherServer.length > 0 ? `
      <div class="dl-section-label" style="margin-top:24px">Backend Server — other platforms</div>
      <div class="dl-downloads">${otherServer.map(d => renderCard(d, 'secondary', version)).join('')}</div>
    ` : '';
    return `
      <details class="dl-details"${defaultOpen ? ' open' : ''}>
        <summary class="dl-toggle"><span class="dl-arrow">&#9654;</span> All platforms &amp; formats</summary>
        ${appHtml}
        ${serverHtml}
      </details>
    `;
  }

  function renderLegacyView(assets, tagName) {
    const downloadable = assets.filter(a => (!a.name.endsWith('.tar.gz') && !a.name.endsWith('.zip')) || a.name.includes('freemocap'));
    const itemsHtml = downloadable.map(a => `
      <a href="${escapeHtml(a.browser_download_url)}" class="dl-legacy-asset">
        <span class="dl-legacy-asset-name">${escapeHtml(a.name)}</span>
        <span class="dl-legacy-asset-size">${escapeHtml(formatBytes(a.size))}</span>
      </a>
    `).join('');

    return `
      <div class="dl-legacy-notice">
        <span class="dl-legacy-notice-icon">📦</span>
        <div>This release (<strong>${escapeHtml(tagName)}</strong>) predates our smart download page. Here are all available files — pick the one that matches your system.</div>
      </div>
      <div class="dl-legacy-asset-list">${itemsHtml}</div>
    `;
  }

  // ── state ────────────────────────────────────────────────
  const state = {
    os: 'unknown',
    arch: 'x64',
    hasManualSystem: false,
    variant: 'cpu',
    gpuDetected: false,
    hasManualVariant: false,
    tag: `v${DEFAULT_VERSION}`,
    hasManualVersion: false,
    releases: [],
    releasesLoading: true,
    r2Sizes: {},
  };

  function currentActiveNotes() {
    return OS_NOTES.filter(n => n.os === state.os && (n.arch === undefined || n.arch === state.arch));
  }

  function renderSystemDetector() {
    const textEl = document.getElementById('dl-detected-text');
    const label = OS_LABELS[state.os] || state.os;
    textEl.innerHTML = `Detected: <strong>${escapeHtml(label)} · ${escapeHtml(archLabel(state.arch))}</strong>`;
    document.querySelectorAll('#dl-os-pills .dl-pill').forEach(btn => {
      btn.classList.toggle('dl-pill-active', btn.dataset.os === state.os && btn.dataset.arch === state.arch);
    });
  }

  function renderVariantDetector() {
    const row = document.getElementById('dl-variant-detect');
    const show = state.os !== 'unknown' && hasVariant(state.os, state.arch);
    row.hidden = !show;
    if (!show) return;

    document.getElementById('dl-variant-detected-text').innerHTML = state.gpuDetected
      ? 'Detected: <strong>NVIDIA GPU</strong>'
      : 'No GPU detected, recommending <strong>CPU-only</strong>';

    document.querySelectorAll('#dl-variant-pills .dl-pill').forEach(btn => {
      btn.classList.toggle('dl-pill-active', btn.dataset.variant === state.variant);
    });
  }

  function renderVersionSelect() {
    const row = document.getElementById('dl-version-row');
    const select = document.getElementById('dl-version-select');
    if (state.releasesLoading || state.releases.length === 0) {
      row.hidden = true;
      return;
    }
    row.hidden = false;

    if (select.options.length === 0) {
      select.innerHTML = state.releases.map((r, i) => {
        let label = r.tag_name;
        if (i === 0) label += ' (latest)';
        if (r.prerelease) label += ' · pre-release';
        return `<option value="${escapeHtml(r.tag_name)}">${escapeHtml(label)}</option>`;
      }).join('');
    }
    select.value = state.tag;
  }

  function renderMainContent() {
    const primaryContainer = document.getElementById('dl-primary');
    const secondaryContainer = document.getElementById('dl-secondary');
    const version = stripVersionPrefix(state.tag);
    const selectedRelease = state.releases.find(r => r.tag_name === state.tag);
    const isLegacy = selectedRelease ? !matchesExpectedPattern(selectedRelease.assets, version) : false;

    if (isLegacy && selectedRelease) {
      primaryContainer.innerHTML = renderLegacyView(selectedRelease.assets, selectedRelease.tag_name);
      secondaryContainer.innerHTML = '';
      return;
    }

    let appDownloads = buildAppDownloads(version);
    let serverDownloads = buildServerDownloads(version);
    if (selectedRelease) {
      appDownloads = enrichDownloadsWithAssets(appDownloads, selectedRelease.assets);
      serverDownloads = enrichDownloadsWithAssets(serverDownloads, selectedRelease.assets);
    }
    appDownloads = enrichDownloadsWithR2Sizes(appDownloads, version, state.r2Sizes);
    serverDownloads = enrichDownloadsWithR2Sizes(serverDownloads, version, state.r2Sizes);

    const matchesVariant = d => !d.variant || d.variant === state.variant;
    const recApp = [], altApp = [], otherApp = [];
    appDownloads.forEach(d => {
      if (d.os === state.os && d.arch === state.arch && matchesVariant(d)) {
        (d.recommended ? recApp : altApp).push(d);
      } else {
        otherApp.push(d);
      }
    });
    const recServer = [], otherServer = [];
    serverDownloads.forEach(d => {
      if (d.os === state.os && d.arch === state.arch && matchesVariant(d)) recServer.push(d);
      else otherServer.push(d);
    });

    const isUnavailablePlatform = state.os !== 'unknown' && recApp.length === 0 && altApp.length === 0 && recServer.length === 0;
    const osForInstructions = state.os === 'unknown' ? undefined : state.os;
    const showVariantPicker = state.os !== 'unknown' && hasVariant(state.os, state.arch);
    const variantForInstructions = showVariantPicker ? state.variant : undefined;

    const appInstructions = (osForInstructions && !isUnavailablePlatform) ? getAppInstallInstructions(osForInstructions, state.arch, variantForInstructions, version) : [];
    const serverInstructions = (osForInstructions && !isUnavailablePlatform) ? getServerInstallInstructions(osForInstructions, state.arch, variantForInstructions, version) : [];

    const activeNotes = currentActiveNotes();
    const noDetect = state.os === 'unknown';
    const terminalTipOs = (osForInstructions && osForInstructions !== 'windows') ? osForInstructions : undefined;

    const primaryHtml = renderDownloadSection({
      icon: '',
      title: 'App Installer',
      leadHtml: '<strong>Recommended.</strong> Desktop application with camera preview, recording controls, and settings. The backend server is already bundled inside, meaning you don’t need to download it separately.',
      recommended: recApp,
      alternates: altApp,
      installInstructions: appInstructions,
      version,
      sectionVariant: 'primary',
      noDetectMessage: noDetect ? 'Could not detect your OS. See all downloads below.' : undefined,
      showTerminalTip: osForInstructions === 'linux',
      terminalTipOs,
      notes: activeNotes,
      notesStartIndex: 0,
      terminalInstallHtml: !isUnavailablePlatform ? renderTerminalInstallSection(state.os, state.arch, variantForInstructions, version) : '',
    });

    primaryContainer.innerHTML = primaryHtml;
    wireLinkedIssues(primaryContainer, activeNotes);
    wireCopyButtons(primaryContainer);

    let secondaryHtml = '';
    if (!isUnavailablePlatform) {
      secondaryHtml += '<hr class="dl-section-divider">';
      secondaryHtml += renderDownloadSection({
        icon: '⚡',
        title: 'FreeMoCap Backend Server',
        subtitleHtml: '<strong>Advanced</strong> — headless machines, remote capture rigs, API use',
        detailsLabel: 'When do I need this?',
        detailsContentHtml: 'Just the camera backend server binary, no GUI. Useful for headless capture rigs, remote systems you connect to over a network, or building a custom client against the FreeMoCap API. <strong>You don’t need this if you downloaded the App Installer above.</strong>',
        recommended: recServer,
        alternates: null,
        installInstructions: serverInstructions,
        version,
        sectionVariant: 'secondary',
        showTerminalTip: osForInstructions != null && osForInstructions !== 'windows',
        terminalTipOs,
        notes: [],
        notesStartIndex: activeNotes.length,
      });
    }

    secondaryHtml += renderAllPlatformsSection(otherApp, otherServer, version, noDetect);

    secondaryContainer.innerHTML = secondaryHtml;
    wireCopyButtons(secondaryContainer);
  }

  function render() {
    renderSystemDetector();
    renderVariantDetector();
    renderVersionSelect();
    renderMainContent();
  }

  // ── R2 sizes (re-fetched whenever the selected version changes) ──
  function refreshR2Sizes() {
    const version = stripVersionPrefix(state.tag);
    const all = [...buildAppDownloads(version), ...buildServerDownloads(version)];
    const urls = all.filter(d => isR2Hosted(d.os, d.variant)).map(d => downloadUrl(d.file, d.os, version, d.variant));
    if (urls.length === 0) return;
    fetchR2Sizes(urls).then(sizes => {
      state.r2Sizes = sizes;
      render();
    });
  }

  // ── init ─────────────────────────────────────────────────
  const detected = detectSystem();
  state.os = detected.os;
  state.arch = detected.arch;

  refineMacArch(arch => {
    if (!state.hasManualSystem && state.os === 'macos') {
      state.arch = arch;
      render();
    }
  });

  const gpu = detectGpu();
  state.variant = gpu.variant;
  state.gpuDetected = gpu.detected;

  document.querySelectorAll('#dl-os-pills .dl-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      state.os = btn.dataset.os;
      state.arch = btn.dataset.arch;
      state.hasManualSystem = true;
      render();
    });
  });

  document.querySelectorAll('#dl-variant-pills .dl-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      state.variant = btn.dataset.variant;
      state.hasManualVariant = true;
      render();
    });
  });

  document.getElementById('dl-version-select').addEventListener('change', e => {
    state.tag = e.target.value;
    state.hasManualVersion = true;
    render();
    refreshR2Sizes();
  });

  render();

  try {
    const releases = await fetchReleases();
    state.releases = releases;
    state.releasesLoading = false;
    if (releases.length > 0 && !state.hasManualVersion) {
      state.tag = releases[0].tag_name;
    }
    render();
    refreshR2Sizes();
  } catch (_) {
    state.releasesLoading = false;
    render();
  }
})();
