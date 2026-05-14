const GUIDE_KEYWORDS = ['guide', 'tutorial', 'migrate', 'migration', 'setup', 'install', 'walkthrough', 'how to', 'workflow', 'memory', 'active memory', 'dreaming', 'local model', 'ollama', 'mlx', 'gemma'];
const RELEASE_KEYWORDS = ['release', 'beta', 'hotfix', 'stable', 'changelog', 'preview', 'rc', 'version'];
const SECURITY_KEYWORDS = ['security', 'cve', 'hardening', 'vulnerability', 'exploit', 'patch', 'advisory', 'incident', 'ssrf', 'redos'];
const COMMUNITY_SIGNALS = ['community roundup', 'creator roundup', 'video roundup', 'youtube roundup', 'week in review', 'pulse', 'debate', 'show hn', 'ask hn', 'lex fridman', 'traversy media', 'ibm'];

function normalize(text) {
  return String(text || '').toLowerCase();
}

function countMatches(text, keywords) {
  return keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
}

function inferSection(input) {
  const title = normalize(input.title);
  const excerpt = normalize(input.excerpt || input.summary);
  const content = normalize(input.content || input.body || input.content_text);
  const haystack = `${title} ${excerpt} ${content}`;

  const isCommunityStyle = COMMUNITY_SIGNALS.some((keyword) => haystack.includes(keyword));

  let securityScore = countMatches(title, SECURITY_KEYWORDS) * 4 + countMatches(excerpt, SECURITY_KEYWORDS) * 2 + countMatches(content, SECURITY_KEYWORDS);
  let releaseScore = countMatches(title, RELEASE_KEYWORDS) * 4 + countMatches(excerpt, RELEASE_KEYWORDS) * 2 + countMatches(content, RELEASE_KEYWORDS);
  let guideScore = countMatches(title, GUIDE_KEYWORDS) * 4 + countMatches(excerpt, GUIDE_KEYWORDS) * 2 + countMatches(content, GUIDE_KEYWORDS);

  if (/(how to|guide|tutorial|walkthrough|migrate|migration|setup)/.test(title)) guideScore += 4;
  if (/(security|hardening|cve|exploit|vulnerability)/.test(title)) securityScore += 4;
  if (/(release|beta|hotfix|stable|preview|v\d{4}\.)/.test(title)) releaseScore += 4;

  if (isCommunityStyle) {
    guideScore -= 4;
    if (!/(how to|guide|tutorial|walkthrough|migrate|migration|setup)/.test(title)) {
      guideScore -= 3;
    }
  }

  const scored = [
    ['Security', securityScore],
    ['Guides', guideScore],
    ['Releases', releaseScore],
  ].sort((a, b) => b[1] - a[1]);

  return scored[0][1] >= 4 ? scored[0][0] : 'OpenClaw News';
}

function inferFeedTags(input) {
  const haystack = normalize(`${input.title} ${input.summary || input.excerpt} ${input.content_text || input.body || input.content}`);
  const tags = ['OpenClaw'];
  const section = inferSection(input);

  if (section === 'Security') tags.push('Security');
  if (section === 'Guides') tags.push('Guides');
  if (section === 'Releases') tags.push('Releases');
  if (/memory|dreaming|active memory|recall|wiki/.test(haystack)) tags.push('Memory');
  if (/ollama|local model|macbook air|on-device|gemma|mlx/.test(haystack)) tags.push('Local Models');
  if (tags.length === 1) tags.push('News');

  return [...new Set(tags)];
}

module.exports = {
  inferSection,
  inferFeedTags,
};
