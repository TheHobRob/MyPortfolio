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
const TEMPLATE_PATH = path.join(__dirname, "templates", "post-template.html");
const INDEX_OUTPUT_PATH = path.join(__dirname, "posts-index.json");

// -------------------------------------------------
// STEP 1: Render a single "runs" array (the shared
// text-formatting pattern used across paragraph,
// list items, and columns)
// -------------------------------------------------
function renderRuns(runs) {
  return runs
    .map((run) => {
      let text = escapeHtml(run.text);
      if (run.link) text = `<a href="${run.link}">${text}</a>`;
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
// STEP 3: Load template, inject rendered content + metadata
// Template should contain placeholders like {{TITLE}}, {{BODY}}, etc.
// -------------------------------------------------
function renderPost(post, template) {
  const bodyHtml = renderBody(post.body);
  const tagsHtml = post.tags.map((t) => `<span class="tag">${t}</span>`).join("");

  return template
    .replace(/{{TITLE}}/g, escapeHtml(post.title))
    .replace(/{{AUTHOR}}/g, escapeHtml(post.author))
    .replace(/{{DATE}}/g, post.date)
    .replace(/{{TAGS}}/g, tagsHtml)
    .replace(/{{HERO_IMAGE_SRC}}/g, post.heroImage?.src || "")
    .replace(/{{HERO_IMAGE_ALT}}/g, post.heroImage?.alt || "")
    .replace(/{{BODY}}/g, bodyHtml);
}

// -------------------------------------------------
// STEP 4: Main build process
// -------------------------------------------------
function build() {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  const postFiles = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"));

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const indexEntries = [];

  postFiles.forEach((filename) => {
    const filePath = path.join(POSTS_DIR, filename);
    const post = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Render and write the individual post page
    const html = renderPost(post, template);
    const outputPath = path.join(OUTPUT_DIR, `${post.slug}.html`);
    fs.writeFileSync(outputPath, html, "utf-8");
    console.log(`Built: ${outputPath}`);

    // Collect lightweight summary for posts-index.json
    indexEntries.push({
      slug: post.slug,
      title: post.title,
      date: post.date,
      tags: post.tags,
      excerpt: post.excerpt,
      heroImage: post.heroImage,
    });
  });

  // Sort newest first, write the index file
  indexEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.writeFileSync(INDEX_OUTPUT_PATH, JSON.stringify(indexEntries, null, 2), "utf-8");
  console.log(`Built posts-index.json with ${indexEntries.length} posts`);
}

build();
