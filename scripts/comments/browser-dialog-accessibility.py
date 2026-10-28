from playwright.sync_api import sync_playwright
import json,pathlib,argparse
from urllib.parse import urlparse
parser=argparse.ArgumentParser(description='仅在本机候选验证导航、弹窗栈与卸载，不发邮件')
parser.add_argument('--base',default='http://127.0.0.1:4336')
parser.add_argument('--output',type=pathlib.Path,required=True)
args=parser.parse_args()
assert urlparse(args.base).hostname in ('127.0.0.1','localhost'), '只允许本机候选'
base=args.base.rstrip('/')
args.output.mkdir(parents=True,exist_ok=True)
out=args.output;r={}
with sync_playwright() as p:
 b=p.chromium.launch(channel='msedge',headless=True);r['browser']=b.version;page=b.new_page(viewport={'width':390,'height':844})
 page.route('**/umami.mcxiaochen.top/**',lambda r:r.abort())
 page.goto(base+'/archive/',wait_until='networkidle')
 page.locator('#mobile-menu-toggle').click();old=page.evaluate('localStorage.getItem("theme")');page.locator('.mobile-menu__theme').click();page.wait_for_timeout(600)
 assert page.evaluate('localStorage.getItem("theme")')!=old;page.keyboard.press('Escape')
 for path in ['/tags/','/categories/','/envelope/#comments','/archive/','/envelope/#comments']:
  page.evaluate('(path)=>{let a=document.createElement("a");a.href=path;document.body.append(a);a.click();a.remove()}',path)
  page.wait_for_url('**'+path);page.wait_for_timeout(700)
  if 'comments' in path:
   page.locator('.atk-send-btn').wait_for();assert page.locator('.atk-main-editor').count()==1
   page.locator('.atk-send-btn').click();page.keyboard.press('Escape');assert page.locator('[inert]').count()==0
  page.locator('#mobile-menu-toggle').click();page.keyboard.press('Escape');assert not page.locator('#mobile-menu').evaluate('(e)=>e.open')
 r['routes_theme_single_mount']='passed'
 page.goto(base+'/archive/',wait_until='networkidle')
 r['nested_dialog']=page.evaluate('''async()=>{
 const {commentDialogs}=await import('/src/utils/comment-dialogs.ts');
 const events={}; const wrap=document.createElement('div');wrap.className='atk-layer-wrap';document.body.append(wrap);
 const manager={getEl:()=>wrap,create(name){const el=document.createElement('div');el.dataset.layerName=name;el.style.display='none';wrap.append(el);return {getEl:()=>el,show(){el.style.display='block'},hide(){el.style.display='none'},destroy(){el.remove()},getAllowMaskClose:()=>true}}};
 commentDialogs({on:(name,fn)=>events[name]=fn,inject:()=>manager});events.created();
 const opener=document.createElement('button');document.body.append(opener);opener.focus();
 const parent=manager.create('login');parent.getEl().innerHTML='<button>父窗口操作</button>';parent.show();
 const child=manager.create('checker-test');child.getEl().innerHTML='<input aria-label="验证码"><button data-action="cancel">取消</button>';
 let cancelled=0;child.getEl().querySelector('button').onclick=()=>{cancelled++;child.destroy()};child.show();
 if(!parent.getEl().inert||!child.getEl().contains(document.activeElement))throw Error('嵌套焦点错误');
 document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
 if(cancelled!==1||parent.getEl().inert||!parent.getEl().contains(document.activeElement))throw Error('未调用原生取消或未恢复父窗口');
 parent.hide();if(document.activeElement!==opener)throw Error('焦点未返回');
 parent.show();events.unmounted();if(document.querySelectorAll('[inert]').length)throw Error('卸载未清理 inert');wrap.remove();opener.remove();return 'native cancel, nested restore and unmount passed';
 }''')
 b.close()
(out/'route-layer.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(r,ensure_ascii=False))
