import { commentConfig } from "../config/comment";

type AvatarComment = { id: number; email_encrypted?: string };
let historical: Record<string, string> = {};
let loading: Promise<void> | undefined;

/** 主评论与侧栏共用一份映射；失败后允许下一次加载重试。 */
export function loadCommentAvatars(): Promise<void> {
  return loading ??= fetch(commentConfig.avatarMap).then(async (response) => {
    if (!response.ok) throw new Error(`头像映射 HTTP ${response.status}`);
    historical = await response.json();
  }).catch((error) => {
    loading = undefined;
    console.warn("[Artalk] 历史头像映射暂时不可用", error);
  });
}

export function gravatarURL(comment: AvatarComment): string {
  return `${commentConfig.gravatar.mirror}${encodeURIComponent(comment.email_encrypted || "")}?${commentConfig.gravatar.params}`;
}

export function commentAvatarURL(comment: AvatarComment): string {
  return Object.hasOwn(historical, String(comment.id)) ? historical[String(comment.id)] : gravatarURL(comment);
}

/** error 不冒泡；由组件的捕获监听器调用。QQ 失败仅回退一次。 */
export function fallbackCommentAvatar(image: HTMLImageElement): void {
  if (image.dataset.avatarFallback || !image.src.startsWith("https://thirdqq.qlogo.cn/")) {
    image.hidden = true;
    return;
  }
  image.dataset.avatarFallback = "1";
  image.src = image.dataset.gravatar || gravatarURL({ id: 0 });
}
