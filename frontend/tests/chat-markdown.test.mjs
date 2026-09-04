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
