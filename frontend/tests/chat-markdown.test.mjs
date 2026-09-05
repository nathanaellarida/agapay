import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("Markdown tables have a labeled keyboard-accessible scroll area", async () => {
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
          "| Step | Estimated cost |",
          "| :--- | ---: |",
          "| Registration | PHP 500 |",
        ].join("\n"),
      }],
      onMessagesChange() {},
    }));
    const wrapper = html.match(/<div[^>]*role="region"[^>]*><table>[\s\S]*?<\/table><\/div>/)?.[0];
    assert.ok(wrapper, "table must be inside a scroll region");
    assert.match(wrapper, /tabindex="0"/);
    assert.match(wrapper, /aria-label="Response table"/);
    assert.match(wrapper, /class="[^"]*overflow-x-auto/);
    assert.match(wrapper, /<thead><tr><th style="text-align:left">Step<\/th>/);
    assert.match(wrapper, /<td style="text-align:right">PHP 500<\/td>/);
  } finally {
    await server.close();
  }
});

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

test("plain-text export includes the conversation and source citations", async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const { buildPlainTextTranscript } = await server.ssrLoadModule(
      "/src/components/TopBar.jsx"
    );
    const transcript = buildPlainTextTranscript([
      { role: "assistant", content: "__intro__" },
      { role: "user", content: "What permit do I need?" },
      {
        role: "assistant",
        content: "Start with a barangay clearance.",
        sources: [{
          source: "LGU_Barangay_Clearance.txt",
          snippet: "Apply at the barangay hall.",
        }],
      },
    ], { name: "Miko" });

    assert.equal(transcript, [
      "Agapay conversation with Miko",
      "",
      "You:",
      "What permit do I need?",
      "",
      "Miko:",
      "Start with a barangay clearance.",
      "Sources:",
      "- LGU_Barangay_Clearance.txt: Apply at the barangay hall.",
      "",
    ].join("\n"));
    assert.doesNotMatch(transcript, /__intro__/);
  } finally {
    await server.close();
  }
});

test("the workspace exposes its primary content as a main landmark", async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const { default: Workspace } = await server.ssrLoadModule("/src/pages/Workspace.jsx");
    const html = renderToStaticMarkup(createElement(Workspace));
    const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0];

    assert.ok(main, "workspace must expose a main landmark");
    assert.equal((html.match(/<main\b/g) || []).length, 1);
    assert.match(main, /What are we building today\?/);
  } finally {
    await server.close();
  }
});
