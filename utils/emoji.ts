// 絵文字とショートコードの変換ユーティリティ
const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu;

export const emojiToShortcode = (text: string): string => {
  return text.replace(emojiRegex, (match) => {
    const codePoint = Array.from(match)
      .map(char => char.codePointAt(0)?.toString(16))
      .join('-');
    return `:emoji-${codePoint}:`;
  });
};

export const shortcodeToEmoji = (text: string): string => {
  return text.replace(/:emoji-([0-9a-f-]+):/g, (_, codePoint) => {
    const codes = codePoint.split('-').map((code: string) => parseInt(code, 16));
    return String.fromCodePoint(...codes);
  });
};