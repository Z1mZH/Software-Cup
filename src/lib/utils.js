// 最基本的 cn 工具（Tailwind 类名合并）
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}