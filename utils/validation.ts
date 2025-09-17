// utils/validation.ts

/**
 * 最も安全で確実な UUID 検証方法
 * 正規表現の文字範囲エラーを回避
 */
export const isValidUUID = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false
  
  // 基本的な長さとハイフンの位置をチェック
  if (id.length !== 36) return false
  if (id[8] !== '-' || id[13] !== '-' || id[18] !== '-' || id[23] !== '-') return false
  
  // 各セクションを個別に検証（より安全）
  const sections = id.split('-')
  if (sections.length !== 5) return false
  
  const expectedLengths = [8, 4, 4, 4, 12]
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    
    // 長さチェック
    if (section.length !== expectedLengths[i]) return false
    
    // 16進数文字のみかチェック
    for (let j = 0; j < section.length; j++) {
      const char = section[j].toLowerCase()
      if (!(char >= '0' && char <= '9') && !(char >= 'a' && char <= 'f')) {
        return false
      }
    }
  }
  
  return true
}

/**
 * より簡潔な方法（try-catch使用）
 */
export const isValidUUIDSimple = (id: string): boolean => {
  try {
    // 基本的なパターンマッチング（安全な正規表現）
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return pattern.test(id)
  } catch {
    return false
  }
}

/**
 * ネイティブ crypto.randomUUID() との互換性チェック
 */
export const isValidUUIDv4 = (id: string): boolean => {
  try {
    // UUID v4 の厳密なチェック
    const v4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return v4Pattern.test(id)
  } catch {
    return false
  }
}