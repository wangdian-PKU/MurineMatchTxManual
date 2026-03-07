# MurineMatchTxManual Site Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the GitHub Pages documentation site to a styled Jekyll-based document layout with a layered sidebar table of contents, without modifying the body content of `index.md`.

**Architecture:** Keep `index.md` as the single source of documentation content and apply a site-wide layout through Jekyll defaults. Build the sidebar table of contents client-side from rendered headings so the site works on GitHub Pages without unsupported plugins.

**Tech Stack:** GitHub Pages, Jekyll, HTML, CSS, vanilla JavaScript, Python `unittest`

---

### Task 1: Add a site-structure regression test

**Files:**
- Create: `tests/test_docs_site.py`

**Step 1: Write the failing test**

Add a Python `unittest` module that asserts:
- `_config.yml` exists and targets `index.md` with a default layout
- `_layouts/default.html` exists and includes sidebar, content, and script hooks
- `assets/css/site.css` exists and styles the page shell and responsive TOC
- `assets/js/site.js` exists and builds the table of contents from page headings

**Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_docs_site -v`
Expected: FAIL because the Jekyll files do not exist yet.

### Task 2: Implement the Jekyll document shell

**Files:**
- Create: `_config.yml`
- Create: `index.html`
- Create: `_layouts/default.html`
- Create: `assets/css/site.css`
- Create: `assets/js/site.js`

**Step 1: Write minimal implementation**

Add:
- `_config.yml` with site metadata, Markdown settings, and a default layout for `index.md`
- `index.html` as the Jekyll entry page that includes and `markdownify`s `index.md` without editing the Markdown source
- `default.html` with a compact hero, sticky desktop sidebar, mobile TOC toggle, and main article container
- `site.css` for academic documentation styling, code/table/image polish, and mobile responsiveness
- `site.js` to generate a nested TOC from `h2`-`h4` headings, set active states on scroll, and support mobile toggle

**Step 2: Run test to verify it passes**

Run: `python -m unittest tests.test_docs_site -v`
Expected: PASS

### Task 3: Align repository-facing metadata

**Files:**
- Modify: `README.md`

**Step 1: Keep naming consistent**

Ensure the README title and public URL use `MurineMatchTxManual`, matching the planned GitHub repository rename.

**Step 2: Re-run verification**

Run: `python -m unittest tests.test_docs_site -v`
Expected: PASS

### Task 4: Final verification

**Files:**
- Review only: `git diff --stat`

**Step 1: Verify requirements**

Check:
- `index.md` body content remains untouched by this implementation
- Sidebar TOC is produced by new layout/assets, not by editing the Markdown
- README remains aligned with the new package/site naming

**Step 2: Record evidence**

Run the final verification commands before reporting completion.
