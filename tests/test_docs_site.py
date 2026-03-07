import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parent.parent


class DocsSiteStructureTest(unittest.TestCase):
    def test_site_files_exist_with_required_hooks(self):
        config_path = ROOT / "_config.yml"
        entry_path = ROOT / "index.html"
        layout_path = ROOT / "_layouts" / "default.html"
        css_path = ROOT / "assets" / "css" / "site.css"
        js_path = ROOT / "assets" / "js" / "site.js"

        self.assertTrue(config_path.exists(), "_config.yml should exist")
        self.assertTrue(entry_path.exists(), "index.html entry page should exist")
        self.assertTrue(layout_path.exists(), "default layout should exist")
        self.assertTrue(css_path.exists(), "site.css should exist")
        self.assertTrue(js_path.exists(), "site.js should exist")

        config = config_path.read_text(encoding="utf-8")
        entry = entry_path.read_text(encoding="utf-8")
        layout = layout_path.read_text(encoding="utf-8")
        css = css_path.read_text(encoding="utf-8")
        js = js_path.read_text(encoding="utf-8")

        self.assertIn('path: "index.md"', config)
        self.assertIn("layout: default", config)
        self.assertIn("exclude:", config)
        self.assertIn("- docs", config)
        self.assertIn("- tests", config)
        self.assertIn("include_relative index.md", entry)
        self.assertIn("markdownify", entry)

        self.assertIn('class="doc-shell"', layout)
        self.assertIn('id="toc-nav"', layout)
        self.assertIn("assets/css/site.css", layout)
        self.assertIn("assets/js/site.js", layout)

        self.assertIn(".doc-shell", css)
        self.assertIn(".toc-panel", css)
        self.assertIn("@media (max-width: 960px)", css)

        self.assertIn("buildToc", js)
        self.assertIn("toc-nav", js)
        self.assertIn("querySelectorAll", js)


if __name__ == "__main__":
    unittest.main()
