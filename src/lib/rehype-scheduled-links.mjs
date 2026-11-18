import fs from 'node:fs';
import path from 'node:path';

/**
 * Keep cross-links from pointing at a blog post that this build is not publishing.
 *
 * Source markdown is left unchanged. At render time:
 * - a link to a post that is live in this build is pointed at /post/<slug>
 *   (the real route; drafts often say /blog/<slug>)
 * - a link to a post that is not live yet keeps its text and loses the href
 *
 * `publishAsOf` is YYYY-MM-DD or '' to mean the real Eastern calendar day.
 */
export function rehypeScheduledPostLinks(options = {}) {
  const asOf = resolveAsOf(options.publishAsOf);
  const posts = loadPosts(asOf);

  return (tree) => {
    rewrite(tree, posts);
  };
}

const HERO_SRC = path.join(process.cwd(), 'src/assets/blog-heroes');
const HERO_PUBLIC = path.join(process.cwd(), 'public/images/posts');

/**
 * Public images are copied into the site for every build. Keep hero files
 * outside public/, and copy a hero in only when that post is actually publishing.
 * Call cleanup afterward so the copies are not left in the working tree.
 */
export function preparePublishedHeroes(publishAsOf) {
  cleanupPublishedHeroes();
  if (!fs.existsSync(HERO_SRC)) return [];
  const { published } = loadPosts(resolveAsOf(publishAsOf));
  fs.mkdirSync(HERO_PUBLIC, { recursive: true });
  const copied = [];
  for (const file of fs.readdirSync(HERO_SRC)) {
    if (!/\.(svg|jpe?g|png|webp)$/i.test(file)) continue;
    const slug = file.replace(/\.[^.]+$/, '');
    if (!published.has(slug)) continue;
    fs.copyFileSync(path.join(HERO_SRC, file), path.join(HERO_PUBLIC, file));
    copied.push(file);
  }
  return copied;
}

export function cleanupPublishedHeroes() {
  if (!fs.existsSync(HERO_SRC) || !fs.existsSync(HERO_PUBLIC)) return;
  for (const file of fs.readdirSync(HERO_SRC)) {
    const dest = path.join(HERO_PUBLIC, file);
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
  }
}

function resolveAsOf(override) {
  if (typeof override === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function loadPosts(asOf) {
  const dir = path.join(process.cwd(), 'src/content/posts');
  const all = new Set();
  const published = new Set();
  if (!fs.existsSync(dir)) return { all, published };

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const slug = file.slice(0, -3);
    all.add(slug);
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const date = frontmatterDate(raw);
    if (!date || date <= asOf) published.add(slug);
  }
  return { all, published };
}

function frontmatterDate(raw) {
  const fence = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fence) return null;
  const match = fence[1].match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
  return match ? match[1] : null;
}

function postSlugFromHref(href) {
  if (typeof href !== 'string' || href.length === 0) return null;
  let pathname = href.trim();
  if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
    try {
      const url = new URL(pathname);
      const host = url.hostname.toLowerCase();
      if (host !== 'www.thewellnesswaymason.com' && host !== 'thewellnesswaymason.com') return null;
      pathname = url.pathname;
    } catch {
      return null;
    }
  }
  pathname = pathname.split('#')[0].split('?')[0];
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  const match = pathname.match(/^\/(?:blog|post)\/([^/]+)$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function rewrite(node, posts) {
  if (!node || !Array.isArray(node.children)) return;
  const next = [];
  for (const child of node.children) {
    rewrite(child, posts);
    if (child.type === 'element' && child.tagName === 'a') {
      const slug = postSlugFromHref(child.properties?.href);
      if (slug && posts.all.has(slug)) {
        if (posts.published.has(slug)) {
          child.properties = { ...child.properties, href: `/post/${slug}` };
          next.push(child);
        } else {
          next.push(...(child.children ?? []));
        }
        continue;
      }
    }
    next.push(child);
  }
  node.children = next;
}
