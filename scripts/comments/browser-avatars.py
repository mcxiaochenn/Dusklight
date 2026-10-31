"""验证历史头像、失败回退与评论控件；不发送评论，不使用个人浏览器资料。"""
import argparse
import hashlib
import json
import pathlib
import urllib.request
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base-url", default="http://127.0.0.1:4324")
parser.add_argument("--output", default="Temp/avatar-verification")
args = parser.parse_args()
out = pathlib.Path(args.output)
out.mkdir(parents=True, exist_ok=True)
mapping = json.loads(pathlib.Path("public/comments/historical-avatars.json").read_text())
report = {"historical_qq_comments": len(mapping), "page_errors": []}

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.route("**/umami.mcxiaochen.top/**", lambda route: route.abort())
    page.on("pageerror", lambda error: report["page_errors"].append(str(error)))

    def ready():
        page.wait_for_function("document.querySelector('.comments-status')?.hidden === true", timeout=30000)
        page.locator(".atk-main-editor").scroll_into_view_if_needed()

    page.goto(args.base_url + "/envelope/#comments", wait_until="domcontentloaded")
    ready()
    page.wait_for_function("[...document.querySelectorAll('.atk-avatar img')].filter(e=>e.src.includes('qlogo')).every(e=>e.complete&&e.naturalWidth>0)", timeout=30000)
    pictures = page.locator(".atk-avatar img").evaluate_all("els => els.map(e=>({id:e.closest('.atk-comment-wrap').id.replace('atk-comment-',''),src:e.src,width:e.naturalWidth,height:e.naturalHeight}))")
    qq = [image for image in pictures if image["id"] in mapping]
    assert qq, "当前页面未显示已匹配的 QQ 头像"
    assert all(image["src"] == mapping[image["id"]] and image["width"] > 1 and image["height"] > 1 for image in qq)
    assert all("d=identicon" in image["src"] for image in pictures if image["id"] not in mapping)
    samples = []
    for url in list(dict.fromkeys(image["src"] for image in qq))[:5]:
        with urllib.request.urlopen(url, timeout=20) as response:
            content = response.read()
            assert response.headers.get("Content-Type", "").startswith("image/") and len(content) > 200
            samples.append({"bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
    assert len({image["sha256"] for image in samples}) > 1, "头像样本全部相同，不能证明恢复了用户头像"
    report["qq_loaded"] = len(qq)
    report["distinct_image_samples"] = samples
    page.goto(args.base_url + "/", wait_until="domcontentloaded")
    page.locator(".recent-comments").scroll_into_view_if_needed()
    page.wait_for_selector(".recent-comments li img", timeout=20000)
    recent = page.locator(".recent-comments li").evaluate_all("els => els.map(e=>({id:e.querySelector('a').hash.replace('#atk-comment-',''),src:e.querySelector('img')?.src}))")
    assert len(recent) == 5
    assert all(item["src"] == mapping[item["id"]] if item["id"] in mapping else "d=identicon" in item["src"] for item in recent)
    report["sidebar_uses_same_avatar_rules"] = "ok"
    page.goto(args.base_url + "/envelope/#comments", wait_until="domcontentloaded")
    ready()

    for width in (1440, 390):
        page.set_viewport_size({"width": width, "height": 1000 if width == 1440 else 844})
        for dark in (False, True):
            page.evaluate("dark => document.documentElement.classList.toggle('dark', dark)", dark)
            page.locator(".atk-main-editor").scroll_into_view_if_needed()
            assert not page.evaluate("document.documentElement.scrollWidth > innerWidth")
            assert page.locator(".atk-main-editor").evaluate("el => getComputedStyle(el).backdropFilter") == "none"
            page.screenshot(path=str(out / f"comments-{width}-{'dark' if dark else 'light'}.png"))
    report["visual_viewports"] = [1440, 390]

    page.locator(".atk-textarea").fill("**预览验收**，不发送评论。")
    page.locator('.atk-plug-btn:has([aria-label="预览"])').click()
    page.locator(".atk-editor-plug-preview strong").wait_for(state="visible")
    assert page.locator(".atk-editor-plug-preview strong").text_content() == "预览验收"
    page.locator('.atk-plug-btn:has([aria-label="预览"])').click()
    page.locator('.atk-plug-btn:has([aria-label="表情"])').click()
    page.locator(".atk-editor-plug-emoticons").wait_for(state="visible")
    page.locator('.atk-plug-btn:has([aria-label="表情"])').click()
    page.locator(".atk-common-action-btn").filter(has_text="回复").first.click()
    page.locator(".atk-state-wrap .atk-state-btn").wait_for(state="visible")
    page.wait_for_function("document.querySelector('.atk-state-wrap')?.textContent.includes('回复')")
    assert "回复" in page.locator(".atk-state-wrap").text_content(), "回复状态未出现"
    page.locator(".atk-state-wrap .atk-cancel").click()
    page.locator(".atk-state-wrap .atk-state-btn").wait_for(state="detached")
    report["preview_emoticons_reply_cancel"] = "ok"

    page.route("**/thirdqq.qlogo.cn/**", lambda route: route.abort())
    page.reload(wait_until="domcontentloaded")
    ready()
    page.wait_for_function("document.querySelector('.atk-avatar img[data-avatar-fallback=\"1\"]')", timeout=20000)
    failed = page.locator('.atk-avatar img[data-avatar-fallback="1"]').first
    assert "gravatar.com/avatar/" in failed.get_attribute("src") and "d=identicon" in failed.get_attribute("src")
    before = failed.get_attribute("src")
    failed.evaluate("e => e.dispatchEvent(new Event('error'))")
    assert failed.get_attribute("src") == before, "失败回退循环修改了图片地址"
    report["qq_failure_falls_back_once"] = "ok"
    assert not report["page_errors"], report["page_errors"]
    browser.close()

(out / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False))
