import { commentConfig } from "../config/comment";

type AvatarComment = { id: number; avatar_url?: string };
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

export function commentAvatarURL(comment: AvatarComment): string {
  return comment.avatar_url || (Object.hasOwn(historical, String(comment.id)) ? historical[String(comment.id)] : commentConfig.defaultAvatar);
}

/** 远程图片只回退一次；本地图也失败时保留容器中的图标。 */
export function fallbackCommentAvatar(image: HTMLImageElement): void {
  if (image.dataset.commentAvatarFallback || image.src === new URL(commentConfig.defaultAvatar, image.ownerDocument.baseURI).href) {
    image.hidden = true;
    return;
  }
  image.dataset.commentAvatarFallback = "1";
  image.src = commentConfig.defaultAvatar;
}
