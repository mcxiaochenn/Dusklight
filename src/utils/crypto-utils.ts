import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";

// 加密常量 — 客户端 Encryptor.astro 中的内联脚本必须保持同步
export const CRYPTO_CONSTANTS = {
	PBKDF2_ITERATIONS: 100000,
	SALT_LENGTH: 16,
	IV_LENGTH: 12,
	AUTH_TAG_LENGTH: 16,
	KEY_LENGTH: 32,
	VERIFY_PREFIX: "DUSKLIGHT-VERIFY:",
} as const;

/**
 * 加密 HTML 内容
 *
 * salt 与 iv 必须随机生成，不能由密码派生。二者都随密文一起公开存储：
 * 若由密码派生，攻击者只需对候选密码做 1 次 HMAC 并与公开的 salt 比对，
 * 即可判定密码是否正确，从而完全绕过 PBKDF2 的十万次迭代成本；
 * 而 iv 固定还会在同一密码重新构建同一篇文章时造成 AES-GCM nonce 复用。
 *
 * 协议：在明文前添加验证前缀，使客户端可以快速验证密码是否正确，
 * 无需等待完整 AES-GCM 解密失败。
 *
 * 输出格式：base64(salt[16] + iv[12] + authTag[16] + ciphertext)
 * 其中 ciphertext = AES-256-GCM-encrypt("DUSKLIGHT-VERIFY:" + html)
 */
export function encryptContent(html: string, password: string): string {
	const {
		PBKDF2_ITERATIONS,
		SALT_LENGTH,
		IV_LENGTH,
		KEY_LENGTH,
		VERIFY_PREFIX,
	} = CRYPTO_CONSTANTS;

	const plaintext = VERIFY_PREFIX + html;

	const salt = randomBytes(SALT_LENGTH);
	const iv = randomBytes(IV_LENGTH);
	const key = pbkdf2Sync(
		password,
		salt,
		PBKDF2_ITERATIONS,
		KEY_LENGTH,
		"sha256",
	);

	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	return Buffer.concat([salt, iv, authTag, encrypted]).toString("base64");
}
