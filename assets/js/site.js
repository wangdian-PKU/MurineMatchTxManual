function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function ensureHeadingIds(headings) {
  const usedIds = new Set();

  headings.forEach((heading) => {
    let id = heading.id ? heading.id.trim() : "";

    if (!id) {
      id = slugify(heading.textContent || heading.innerText || "section");
    }

    let candidate = id || "section";
    let suffix = 2;

    while (usedIds.has(candidate)) {
      candidate = `${id}-${suffix}`;
      suffix += 1;
    }

    heading.id = candidate;
    usedIds.add(candidate);
  });
}

function buildNestedList(items) {
  const root = document.createElement("ul");
  root.className = "toc-list";
  const listStack = [root];
  const levelStack = [2];

  items.forEach((item) => {
    const level = Math.min(Math.max(item.level, 2), 4);

    while (level > levelStack[levelStack.length - 1]) {
      const previousList = listStack[listStack.length - 1];
      const lastItem = previousList.lastElementChild;
      const sublist = document.createElement("ul");
      sublist.className = "toc-sublist";

      if (lastItem) {
        lastItem.appendChild(sublist);
        listStack.push(sublist);
        levelStack.push(levelStack[levelStack.length - 1] + 1);
      } else {
        break;
      }
    }

    while (level < levelStack[levelStack.length - 1] && listStack.length > 1) {
      listStack.pop();
      levelStack.pop();
    }

    const li = document.createElement("li");
    li.className = "toc-item";

    const link = document.createElement("a");
    link.className = "toc-link";
    link.href = `#${item.id}`;
    link.textContent = item.text;
    link.dataset.target = item.id;

    li.appendChild(link);
    listStack[listStack.length - 1].appendChild(li);
  });

  return root;
}

function buildToc() {
  const content = document.getElementById("doc-content");
  const tocNav = document.getElementById("toc-nav");

  if (!content || !tocNav) {
    return [];
  }

  const headings = Array.from(content.querySelectorAll("h2, h3, h4"))
    .filter((heading) => (heading.textContent || "").trim().length > 0);

  ensureHeadingIds(headings);

  const items = headings.map((heading) => ({
    id: heading.id,
    level: Number.parseInt(heading.tagName.replace("H", ""), 10),
    text: heading.textContent.trim(),
  }));

  tocNav.innerHTML = "";

  if (!items.length) {
    const fallback = document.createElement("p");
    fallback.className = "toc-empty";
    fallback.textContent = "No section headings found.";
    tocNav.appendChild(fallback);
    return [];
  }

  tocNav.appendChild(buildNestedList(items));
  return headings;
}

function syncActiveHeading(headings) {
  if (!headings.length) {
    return;
  }

  const links = Array.from(document.querySelectorAll(".toc-link"));
  const linkMap = new Map(links.map((link) => [link.dataset.target, link]));

  function updateActiveLink() {
    const scrollPosition = window.scrollY + 120;
    let activeHeading = headings[0];

    headings.forEach((heading) => {
      if (heading.offsetTop <= scrollPosition) {
        activeHeading = heading;
      }
    });

    links.forEach((link) => link.classList.remove("is-active"));
    const activeLink = linkMap.get(activeHeading.id);
    if (activeLink) {
      activeLink.classList.add("is-active");
    }
  }

  updateActiveLink();
  document.addEventListener("scroll", updateActiveLink, { passive: true });
}

function bindMobileTocToggle() {
  const toggle = document.getElementById("toc-toggle");
  const tocPanel = document.querySelector(".toc-panel");

  if (!toggle || !tocPanel) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = tocPanel.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const headings = buildToc();
  syncActiveHeading(headings);
  bindMobileTocToggle();
});
