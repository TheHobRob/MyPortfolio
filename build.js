/**
 * build.js
 * -------------------------------------------------
 * Reads one JSON file per blog post from /posts/
 * Renders each into a static HTML page using a shared template
 * Also generates posts-index.json (lightweight summary for
 * Home page "latest posts" and Blog index search/filter)
 *
 * Run with: node build.js
 * -------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const POSTS_DIR = path.join(__dirname, "posts");
const OUTPUT_DIR = path.join(__dirname, "blog");
const TEMPLATES_DIR = path.join(__dirname, "templates");
const PARTIALS_DIR = path.join(TEMPLATES_DIR, "partials");
const INDEX_OUTPUT_PATH = path.join(__dirname, "posts-index.json");
const DEFAULT_TEMPLATE = "standard-article";

// -------------------------------------------------
// STEP 1: Render a single "runs" array (the shared
// text-formatting pattern used across paragraph,
// list items, and columns)
// -------------------------------------------------
function renderRuns(runs) {
  return runs
    .map((run) => {
      let text = escapeHtml(run.text);
      if (run.link) {
        const relAttr = run.affiliate
          ? ` rel="sponsored nofollow" target="_blank"`
          : "";
        text = `<a href="${run.link}"${relAttr}>${text}</a>`;
        if (run.affiliate) {
          text += `<span class="affiliate-marker" title="Affiliate link">*</span>`;
        }
      }
      if (run.bold) text = `<strong>${text}</strong>`;
      if (run.italic) text = `<em>${text}</em>`;
      return text;
    })
    .join("");
}

// Basic HTML escaping so post text can't accidentally break markup
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -------------------------------------------------
// STEP 2: Render each block type to HTML
// One function per type, matched by a lookup object
// -------------------------------------------------
const blockRenderers = {
  heading: (block) => `<h2 class="post-heading">${escapeHtml(block.text)}</h2>`,

  paragraph: (block) => `<p class="post-paragraph">${renderRuns(block.runs)}</p>`,

  pullquote: (block) => `
    <blockquote class="pullquote">
      <p>${escapeHtml(block.text)}</p>
      ${block.attribution ? `<cite>${escapeHtml(block.attribution)}</cite>` : ""}
    </blockquote>`,

  image: (block) => `
    <figure class="post-image">
      <img src="${block.src}" alt="${escapeHtml(block.alt)}" />
      ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
    </figure>`,

  imageGroup: (block) => `
    <div class="image-group">
      ${block.images
        .map(
          (img) => `
        <figure>
          <img src="${img.src}" alt="${escapeHtml(img.alt)}" />
          ${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ""}
        </figure>`
        )
        .join("")}
    </div>`,

  list: (block) => {
    const tag = block.style === "ordered" ? "ol" : "ul";
    const items = block.items
      .map((item) => `<li>${renderRuns(item.runs)}</li>`)
      .join("");
    return `<${tag} class="post-list">${items}</${tag}>`;
  },

  columns: (block) => `
    <div class="post-columns">
      ${block.columns
        .map((col) => `<div class="column">${renderRuns(col.runs)}</div>`)
        .join("")}
    </div>`,

  divider: () => `<hr class="post-divider" />`,

  embed: (block) => `<!-- embed placeholder: ${block.provider} -->`,
};

function renderBlock(block) {
  const renderer = blockRenderers[block.type];
  if (!renderer) {
    console.warn(`No renderer for block type: ${block.type}`);
    return "";
  }
  return renderer(block);
}

function renderBody(bodyBlocks) {
  return bodyBlocks.map(renderBlock).join("\n");
}

// -------------------------------------------------
// STEP 3: Related posts (bottom of every post)
// Every other post, shown — same-tag matches first (most shared tags,
// then newest), then everything else (newest first). One unified sort
// naturally produces "related first, then the rest" without needing to
// treat "has a tag match" and "fallback" as separate cases.
// -------------------------------------------------
function getRelatedPosts(post, allPosts) {
  return allPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      post: p,
      sharedCount: p.tags.filter((t) => post.tags.includes(t)).length,
    }))
    .sort((a, b) => {
      if (b.sharedCount !== a.sharedCount) return b.sharedCount - a.sharedCount;
      return new Date(b.post.date) - new Date(a.post.date);
    })
    .map((entry) => entry.post);
}

// Reuses the .zine-card markup/classes from the homepage grid so related
// posts look like part of the same component family, not a new one. The
// "related-card" modifier lets .related-posts-scroll override the grid-only
// border/sizing rules (see blog-zine.css) without fighting their specificity.
function renderRelatedCard(relatedPost, dispatchNumbers) {
  const num = dispatchNumbers.get(relatedPost.slug);
  const label = `Dispatch ${String(num).padStart(2, "0")}`;
  const imgTag = relatedPost.heroImage?.src
    ? `<img src="${relatedPost.heroImage.src}" alt="${escapeHtml(relatedPost.heroImage.alt || "")}">`
    : `<div class="img-placeholder" role="img" aria-label="Post image placeholder">Image</div>`;
  const tags = relatedPost.tags
    .map((t) => `<li class="tag">${escapeHtml(t)}</li>`)
    .join("");

  return `
      <article class="zine-card related-card">
        ${imgTag}
        <p class="zine-byline">${label}</p>
        <h3><a href="${relatedPost.slug}.html">${escapeHtml(relatedPost.title)}</a></h3>
        <p>${escapeHtml(relatedPost.excerpt)}</p>
        <ul class="tag-list">${tags}</ul>
      </article>`;
}

function renderRelatedPosts(relatedPosts, dispatchNumbers) {
  if (relatedPosts.length === 0) return "";
  return `
  <section class="related-posts">
    <div class="wrap" style="max-width:900px;">
      <h2 class="section-title">Related Reading</h2>
      <div class="related-posts-scroll">
        ${relatedPosts.map((p) => renderRelatedCard(p, dispatchNumbers)).join("")}
      </div>
    </div>
  </section>`;
}

// -------------------------------------------------
// STEP 4: Load a post's template (by name, from post.template), with the
// shared header/footer partials already stitched in. Cached per name
// since multiple posts commonly share the same template.
// -------------------------------------------------
const templateCache = {};

function loadTemplate(name, headerPartial, footerPartial) {
  if (templateCache[name]) return templateCache[name];

  const templatePath = path.join(TEMPLATES_DIR, `${name}.html`);
  if (!fs.existsSync(templatePath)) {
    console.warn(`No template file for "${name}" — falling back to "${DEFAULT_TEMPLATE}"`);
    return loadTemplate(DEFAULT_TEMPLATE, headerPartial, footerPartial);
  }

  const raw = fs.readFileSync(templatePath, "utf-8");
  const stitched = raw
    .replace(/{{HEADER}}/g, headerPartial)
    .replace(/{{FOOTER}}/g, footerPartial);

  templateCache[name] = stitched;
  return stitched;
}

// -------------------------------------------------
// STEP 5: Inject rendered content + metadata into the stitched template.
// Template should contain placeholders like {{TITLE}}, {{BODY}}, etc.
// -------------------------------------------------
function renderPost(post, template, allPosts, dispatchNumbers) {
  const bodyHtml = renderBody(post.body);
  const tagsHtml = post.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  const relatedPostsHtml = renderRelatedPosts(
    getRelatedPosts(post, allPosts),
    dispatchNumbers
  );
  // Optional custom sub-title (e.g. "Mystic Martinez") — plain text, since
  // it now sits inside a <span> in the Issue/Subtitle/Date eyebrow row and
  // inherits that row's styling directly (same as the Issue/Date spans).
  const subtitleText = post.subtitle ? escapeHtml(post.subtitle) : "";

  return template
    .replace(/{{TITLE}}/g, escapeHtml(post.title))
    .replace(/{{AUTHOR}}/g, escapeHtml(post.author))
    .replace(/{{DATE}}/g, post.date)
    .replace(/{{TAGS}}/g, tagsHtml)
    .replace(/{{SUBTITLE}}/g, subtitleText)
    .replace(/{{HERO_IMAGE_SRC}}/g, post.heroImage?.src || "")
    .replace(/{{HERO_IMAGE_ALT}}/g, post.heroImage?.alt || "")
    .replace(/{{BODY}}/g, bodyHtml)
    .replace(/{{RELATED_POSTS}}/g, relatedPostsHtml)
    .replace(/{{ISSUE}}/g, post.issue || "");
}

// -------------------------------------------------
// STEP 6: Main build process
// Two passes: (1) parse every post into memory and sort newest-first, so
// (2) each post's related-posts section can be computed with full
// knowledge of every other post before anything gets written to disk.
// -------------------------------------------------
function build() {
  const headerPartial = fs.readFileSync(path.join(PARTIALS_DIR, "header.html"), "utf-8");
  const footerPartial = fs.readFileSync(path.join(PARTIALS_DIR, "footer.html"), "utf-8");
  const postFiles = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"));

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allPosts = postFiles.map((filename) => {
    const filePath = path.join(POSTS_DIR, filename);
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  });
  allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Dispatch numbers read like issue numbers — oldest post is Dispatch 01 —
  // computed once here so related-post cards match the homepage's own
  // client-side numbering (blog.js), which uses the same date order.
  const dispatchNumbers = new Map(
    allPosts.map((p, i) => [p.slug, allPosts.length - i])
  );

  allPosts.forEach((post) => {
    const templateName = post.template || DEFAULT_TEMPLATE;
    const template = loadTemplate(templateName, headerPartial, footerPartial);
    const html = renderPost(post, template, allPosts, dispatchNumbers);
    const outputPath = path.join(OUTPUT_DIR, `${post.slug}.html`);
    fs.writeFileSync(outputPath, html, "utf-8");
    console.log(`Built: ${outputPath} (template: ${templateName})`);
  });

  const indexEntries = allPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    excerpt: post.excerpt,
    heroImage: post.heroImage,
  }));
  fs.writeFileSync(INDEX_OUTPUT_PATH, JSON.stringify(indexEntries, null, 2), "utf-8");
  console.log(`Built posts-index.json with ${indexEntries.length} posts`);
}

build();
