"""对本地静态预览执行只读浏览器验收；不发表真实评论。"""
import argparse
import json
import pathlib
import time
import urllib.parse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base-url", default="http://127.0.0.1:4322")
parser.add_argument("--output", default="Temp/artalk-browser")
args = parser.parse_args()
out = pathlib.Path(args.output)
out.mkdir(parents=True, exist_ok=True)
mapping = json.loads(pathlib.Path("public/comments/legacy-map.json").read_text(encoding="utf-8"))
legacy_id, (legacy_path, new_id) = next((key, value) for key, value in mapping.items() if value[0] == "/envelope/")
report = {"routes": [], "viewports": [], "page_errors": []}

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    context.route("**/umami.mcxiaochen.top/**", lambda route: route.abort())
    page = context.new_page()
    def record_error(error):
        report["page_errors"].append(str(error))
        print("PAGE_ERROR: " + str(error), flush=True)
    page.on("pageerror", record_error)
    requests = []
    page.on("request", lambda req: requests.append(req.url))

    def goto(path):
        page.goto(args.base_url + path, wait_until="domcontentloaded")
        try:
            page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass

    def ready():
        page.locator("#comments").scroll_into_view_if_needed()
        page.wait_for_selector("#comments .atk-main-editor", timeout=25000)
        page.wait_for_function("document.querySelector('.comments-status')?.hidden === true", timeout=25000)
        assert page.locator("#comments").count() == 1
        assert page.locator(".atk-main-editor").count() == 1
        assert page.locator(".artalk").evaluate("el => getComputedStyle(el).getPropertyValue('--at-color-main').trim()")

    goto("/")
    page.locator(".recent-comments").scroll_into_view_if_needed()
    page.wait_for_selector(".recent-comments li", timeout=25000)
    assert page.locator(".recent-comments li").count() == 5
    assert not any("/essay/" in value for value in page.locator(".recent-comments li a").evaluate_all("els => els.map(el => el.getAttribute('href'))"))
    assert not any("Artalk" in url or "artalk.css" in url for url in requests if "/_astro/" in url)
    report["homepage_recent_comments"] = 5

    aliases = json.loads(pathlib.Path("src/config/comment-paths.json").read_text())
    remote = urllib.parse.urlparse(args.base_url).hostname not in ("localhost", "127.0.0.1")
    redirect_count = 0
    for original, target in aliases.items():
        for old_path in ([original, original.rstrip("/")] if remote else [original]):
            old_hash = legacy_id if target == "/envelope/" else "comments"
            final_hash = f"atk-comment-{new_id}" if target == "/envelope/" else "comments"
            goto(old_path + "?migration-test=1#" + old_hash)
            page.wait_for_url("**" + target + "?migration-test=1#" + final_hash, timeout=25000)
            ready()
            redirect_count += 1
    report["legacy_redirects_preserve_query_and_hash"] = "ok"
    report["legacy_redirects_tested"] = redirect_count
    # Astro preview 的 always 模式会在自定义 404 之前拒绝无尾斜杠路径。
    # EdgeOne 内部重写交给兼容页处理，避免平台 HTTP 301 丢失查询参数。
    edge_rules = json.loads(pathlib.Path("public/edgeone.json").read_text())["rewrites"]
    assert len(edge_rules) == len(aliases) * 2
    for rule in edge_rules:
        assert rule["source"].rstrip("/") + "/" in aliases
        assert rule["destination"] == rule["source"].rstrip("/") + "/index.html"
    report["gateway_rewrites"] = len(edge_rules)

    goto("/envelope/#" + legacy_id)
    ready()
    assert page.url.endswith(f"#atk-comment-{new_id}")
    page.wait_for_selector(f"#atk-comment-{new_id}", timeout=20000)
    report["legacy_anchor"] = "ok"
    page.evaluate("window.__artalkQADocument = 1")
    for path in ["/about/", "/link/", "/devices/", "/timeline/", "/categories/", "/posts/p801b/", "/envelope/"]:
        before = len(requests)
        # 真实 anchor click 经 ClientRouter 导航；标记用来排除整页刷新掩盖生命周期问题。
        page.evaluate("path => { const a=document.createElement('a'); a.href=path; document.body.append(a); a.click(); a.remove(); }", path)
        page.wait_for_url("**" + path, timeout=15000)
        ready()
        assert page.evaluate("window.__artalkQADocument") == 1, "未经过 ClientRouter 导航"
        keys = [urllib.parse.parse_qs(urllib.parse.urlparse(url).query).get("page_key", [None])[0] for url in requests[before:] if "/api/v2/comments?" in url]
        assert path in keys, "评论列表使用了旧页面键"
        for dark in [True, False]:
            page.evaluate("dark => document.documentElement.classList.toggle('dark', dark)", dark)
            page.wait_for_function("dark => document.querySelector('.artalk').classList.contains('atk-dark-mode') === dark", arg=dark)
        report["routes"].append(path)

    # 快速换页发生在远程配置尚未完成时，旧实例也必须被释放。
    page.route("**/api/v2/conf*", lambda route: (time.sleep(0.25), route.continue_()))
    for path in ["/about/", "/devices/", "/envelope/"]:
        page.evaluate("path => { const a=document.createElement('a'); a.href=path+'#comments'; document.body.append(a); a.click(); a.remove(); }", path)
        page.wait_for_url("**" + path + "#comments", timeout=15000)
    ready()
    page.unroute("**/api/v2/conf*")
    assert page.locator(".atk-main-editor").count() == 1
    report["rapid_navigation"] = "ok"

    for width, height in [(1440, 1000), (390, 844)]:
        page.set_viewport_size({"width": width, "height": height})
        if width == 390:
            report["mobile_routes"] = []
            for path in ["/about/", "/devices/", "/envelope/"]:
                page.evaluate("path => { const a=document.createElement('a'); a.href=path+'#comments'; document.body.append(a); a.click(); a.remove(); }", path)
                page.wait_for_url("**" + path + "#comments", timeout=15000)
                ready()
                report["mobile_routes"].append(path)
        page.evaluate("window.__scrollTasks=[];window.__scrollObserver=new PerformanceObserver(list=>window.__scrollTasks.push(...list.getEntries().map(e=>e.duration)));window.__scrollObserver.observe({type:'longtask'})")
        page.evaluate("async () => { for(let y=0;y<document.documentElement.scrollHeight;y+=420){window.scrollTo(0,y);await new Promise(r=>requestAnimationFrame(r));} window.scrollTo(0,0); }")
        metrics = page.evaluate("() => {window.__scrollObserver.disconnect(); return {overflow:document.documentElement.scrollWidth>innerWidth+1,long_tasks:window.__scrollTasks.length,max_long_task:Math.max(0,...window.__scrollTasks)};}")
        assert not metrics["overflow"], "移动端出现横向溢出"
        page.locator("#comments").scroll_into_view_if_needed()
        page.screenshot(path=str(out / f"comments-{width}.png"))
        report["viewports"].append({"width": width, **metrics})

    # 断网列表失败后，恢复网络可重试，不能出现第二个实例。
    page.route("**/api/v2/comments**", lambda route: route.abort())
    page.evaluate("() => {const a=document.createElement('a');a.href='/about/#comments';document.body.append(a);a.click();a.remove();}")
    page.wait_for_url("**/about/#comments", timeout=15000)
    page.wait_for_selector(".comments-retry:not([hidden])", timeout=25000)
    page.unroute("**/api/v2/comments**")
    page.locator(".comments-retry").click()
    ready()
    report["failed_request_retry"] = "ok"
    (out / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    assert not report["page_errors"], "存在客户端未处理异常"
    browser.close()

(out / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report))
