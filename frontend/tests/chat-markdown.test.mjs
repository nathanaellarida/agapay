import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("assistant Markdown cannot load images but keeps text, links, and portraits", async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const { default: ChatFeed } = await server.ssrLoadModule("/src/components/ChatFeed.jsx");
    const html = renderToStaticMarkup(createElement(ChatFeed, {
      persona: { key: "tech", name: "Anton", title: "Mentor", image: "/startupAdvisor.png" },
      messages: [{
        role: "assistant",
        content: [
          "**Useful guidance** and [official source](https://example.com/guide).",
          "![inline image](https://untrusted.example/track.png)",
          "![reference image][tracker]",
          "",
          "[tracker]: https://untrusted.example/reference.png",
          "",
          '<img src="https://untrusted.example/html.png">',
        ].join("\n"),
        sources: [{ source: "guide.txt", snippet: "Reviewed guidance" }],
      }],
      onMessagesChange() {},
    }));

    assert.doesNotMatch(html, /<img[^>]+untrusted\.example/);
    assert.equal((html.match(/<img\b/g) || []).length, 1);
    assert.match(html, /src="\/startupAdvisor\.png"/);
    assert.match(html, /<strong>Useful guidance<\/strong>/);
    assert.match(html, /href="https:\/\/example\.com\/guide"/);
    assert.match(html, /guide\.txt: Reviewed guidance/);
  } finally {
    await server.close();
  }
});

test("web links open separately while footnotes and email links keep their behavior", async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const { default: ChatFeed } = await server.ssrLoadModule("/src/components/ChatFeed.jsx");
    const html = renderToStaticMarkup(createElement(ChatFeed, {
      persona: null,
      messages: [{
        role: "assistant",
        content: [
          '[Website](https://example.com/guide "Guide title")',
          "[HTTP](http://example.com/guide)",
          "[Protocol relative](//example.com/guide)",
          "[Email](mailto:help@example.com)",
          "[Section](#section)",
          "[Unsafe](javascript:alert%281%29)",
          "A footnote.[^note]",
          "",
          "[^note]: Supporting detail.",
        ].join("\n\n"),
      }],
      onMessagesChange() {},
    }));
    const links = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || [];
    const external = links.filter((link) => /href="(?:https?:)?\/\//.test(link));
    assert.equal(external.length, 3);
    for (const link of external) {
      assert.match(link, /target="_blank"/);
      assert.match(link, /rel="noopener noreferrer"/);
      assert.match(link, /opens in a new tab/);
    }
    assert.match(external[0], /title="Guide title"/);
    for (const link of links.filter((link) => /href="(?:#|mailto:)/.test(link))) {
      assert.doesNotMatch(link, /target="_blank"/);
    }
    assert.match(html, /data-footnote-ref="true"/);
    assert.match(html, /id="user-content-fn-note"/);
    assert.doesNotMatch(html, /href="javascript:/);
  } finally {
    await server.close();
  }
});
