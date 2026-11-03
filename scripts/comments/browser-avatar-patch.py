"""独立浏览器拦截头像和评论夹具；不登录、不向生产写入。"""
import argparse
import json
import pathlib
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', default='http://127.0.0.1:4324')
parser.add_argument('--output', default='Temp/avatar-browser')
args = parser.parse_args()
out = pathlib.Path(args.output)
out.mkdir(parents=True, exist_ok=True)
svg = pathlib.Path('public/images/avatar-fallback.svg').read_text()
github = 'https://avatars.githubusercontent.com/u/12345?v=4'
qq = 'https://thirdqq.qlogo.cn/g?b=sdk&nk=12345&s=140'
historical = 'https://thirdqq.qlogo.cn/g?b=sdk&nk=67890&s=140'
comments = []
for i, avatar in enumerate([github, qq, None, None, github], 9101):
    item = dict(id=i, content='头像验收', content_marked='<p>头像验收</p>', user_id=i,
                nick=f'头像类型 {i}', email_encrypted='a' * 32, link='https://example.com/',
                ua='', date='2026-10-31 12:00:00', rid=0, is_collapsed=False,
                is_pending=False, is_pinned=False, is_allow_reply=True, is_verified=False,
                badge_name='', badge_color='', visible=True, vote_up=0, vote_down=0,
                page_key='/envelope/', page_url='/envelope/', site_name='Dusklight')
    if avatar:
        item['avatar_url'] = avatar
    comments.append(item)

report = {'modes': {}, 'page_errors': []}
with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    for mode in ['normal', 'remote_failure', 'default_failure', 'mapping_failure']:
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        requests = []
        context.on('request', lambda req: requests.append(req.url))
        context.on('page', lambda page: page.on('pageerror', lambda err: report['page_errors'].append(str(err))))
        context.route('**/umami.mcxiaochen.top/**', lambda route: route.abort())
        # 静态正式产物也只读取隔离候选，绝不访问生产评论 API。
        context.route('https://artalk.mcxiaochen.top/**', lambda route: route.fulfill(response=route.fetch(url=route.request.url.replace('https://artalk.mcxiaochen.top', 'http://127.0.0.1:23477'))))
        context.route('**/comments/historical-avatars.json', lambda route: route.fulfill(status=503) if mode == 'mapping_failure' else route.fulfill(json={'9103': historical, '9105': historical}))
        context.route('**/api/v2/comments?**', lambda route: route.fulfill(headers={'Access-Control-Allow-Origin': '*'}, json={'comments': comments, 'count': 5, 'roots_count': 5, 'page': {'id': 1, 'key': '/envelope/', 'title': '头像验收', 'admin_only': False, 'vote_up': 0, 'vote_down': 0, 'pv': 0}}))
        context.route('**/api/v2/stats/latest_comments?**', lambda route: route.fulfill(headers={'Access-Control-Allow-Origin': '*'}, json={'data': comments}))
        for domain in ['avatars.githubusercontent.com', 'thirdqq.qlogo.cn']:
            context.route(f'**/{domain}/**', lambda route: route.abort() if mode in ['remote_failure', 'default_failure'] else route.fulfill(content_type='image/svg+xml', body=svg))
        if mode == 'default_failure':
            context.route('**/images/avatar-fallback.svg', lambda route: route.abort())
        page = context.new_page()
        console_errors = []
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        page.goto(args.base_url + '/envelope/#comments', wait_until='domcontentloaded')
        try:
            page.wait_for_function("document.querySelectorAll('#comments .atk-avatar img').length === 5")
        except Exception:
            print(json.dumps({'mode': mode, 'errors': report['page_errors'], 'console': console_errors, 'status': page.locator('.comments-status').all_text_contents(), 'requests': requests[-25:]}, ensure_ascii=False))
            raise
        page.wait_for_function("[...document.querySelectorAll('#comments .atk-avatar img')].every(e => e.complete)")
        images = page.locator('#comments .atk-avatar img')
        actual = images.evaluate_all('els => els.map(e => ({src:e.src,hidden:e.hidden,width:e.naturalWidth}))')
        default = args.base_url + '/images/avatar-fallback.svg'
        if mode in ['normal', 'mapping_failure']:
            assert [x['src'] for x in actual] == [github, qq, default if mode == 'mapping_failure' else historical, default, github], actual
            assert all(x['width'] > 0 and not x['hidden'] for x in actual)
        elif mode == 'remote_failure':
            assert all(x['src'] == default and x['width'] > 0 and not x['hidden'] for x in actual), actual
        else:
            assert all(x['hidden'] for x in actual), actual
            assert page.locator('#comments .comment-avatar-fallback').count() == 5
            assert page.locator('#comments .comment-avatar-fallback').first.evaluate("e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0")
        assert page.locator('#comments .atk-avatar a').count() == 5
        if mode == 'normal':
            for width in [1440, 390]:
                page.set_viewport_size({'width': width, 'height': 900})
                for dark in [False, True]:
                    page.evaluate("dark => document.documentElement.classList.toggle('dark',dark)", dark)
                    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
                    page.locator('#comments .atk-comment-wrap').first.scroll_into_view_if_needed()
                    page.screenshot(path=str(out / f'comments-{width}-{dark}.png'))
            page.set_viewport_size({'width': 1440, 'height': 1000})
            page.evaluate("""() => { window.avatarLongTasks=[]; window.avatarObserver=new PerformanceObserver(list=>window.avatarLongTasks.push(...list.getEntries().map(e=>e.duration))); window.avatarObserver.observe({type:'longtask'}); }""")
            for _ in range(3):
                page.mouse.wheel(0, 650)
                page.wait_for_timeout(150)
                page.mouse.wheel(0, -650)
                page.wait_for_timeout(150)
            report['scroll_long_tasks'] = page.evaluate('window.avatarObserver.disconnect(); window.avatarLongTasks')
            for path in ['/', '/envelope/', '/', '/envelope/']:
                page.evaluate("async path => { const a=document.createElement('a'); a.href=path; document.body.append(a); a.click(); a.remove(); }", path)
                page.wait_for_url(args.base_url + path)
                if path == '/':
                    page.locator('.recent-comments').scroll_into_view_if_needed()
                    page.wait_for_function("document.querySelectorAll('.recent-comments__avatar img').length === 5")
                    sidebar = page.locator('.recent-comments__avatar img').evaluate_all('els => els.map(e=>e.src)')
                    assert sidebar == [github, qq, historical, default, github], sidebar
                else:
                    page.locator('#comments').scroll_into_view_if_needed()
                    page.wait_for_function("document.querySelectorAll('#comments .atk-avatar img').length === 5")
                    assert page.locator('.atk-main-editor').count() == 1
                    assert page.locator('#comments .comment-avatar-fallback').count() == 5
            report['route_cycles'] = 2
        page.goto(args.base_url + '/', wait_until='domcontentloaded')
        page.locator('.recent-comments').scroll_into_view_if_needed()
        page.wait_for_function("document.querySelectorAll('.recent-comments__avatar img').length === 5 && [...document.querySelectorAll('.recent-comments__avatar img')].every(e=>e.complete)")
        sidebar = page.locator('.recent-comments__avatar img').evaluate_all('els=>els.map(e=>({src:e.src,hidden:e.hidden,width:e.naturalWidth}))')
        assert sidebar == actual, {'main': actual, 'sidebar': sidebar}
        assert not any('gravatar.com' in url for url in requests), '仍有 Gravatar 请求'
        report['modes'][mode] = {'comments': len(actual), 'gravatar_requests': 0, 'default_requests': sum('/images/avatar-fallback.svg' in url for url in requests)}
        context.close()
    browser.close()
assert not report['page_errors'], report['page_errors']
(out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
