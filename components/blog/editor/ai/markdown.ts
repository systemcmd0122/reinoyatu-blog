"use client"

import type { Editor } from "@tiptap/react"
import type { Node as PMNode } from "@tiptap/pm/model"
import { DOMParser } from "@tiptap/pm/model"

/**
 * AI が生成した Markdown 出力の「ノイズ」を除去する。
 *
 * - BOM / 前後空白の除去
 * - 全体を囲んだ ```markdown / ``` フェンスの除去（AI が余計に付けることが多い）
 * - 「改善後：」「要約：」等の接頭辞行の除去
 *
 * これを行わないと、エディタに挿入した際に ``` や「改善後：」が
 * そのまま本文に残って表示される（MD 崩れのバグ）ため。
 */
export function cleanMarkdownOutput(text: string): string {
  let t = (text || "").replace(/^\uFEFF/, "").trim()
  if (!t) return t

  t = t.replace(/^```(?:markdown|md|markdown[\w-]*|txt)?\s*\n?/i, "")
  t = t.replace(/\n?```\s*$/i, "")

  t = t.replace(
    /^(改善後(?:の)?(?:本文|文章)?[：:]?\s*\n?|要約[：:]\s*|記事の本文[：:]\s*\n?)/,
    ""
  )

  return t.trim()
}

/**
 * Markdown 文字列をエディタのスキーマに沿った ProseMirror ノード列へ変換する。
 *
 * エディタが設定している tiptap-markdown の MarkdownParser（markdown-it ベース）
 * を利用するため、# 見出し / リスト / 引用 / コードブロック / テーブル / インライン
 * 装飾（**太字** など）がエディタと一致した正しいノードになる。
 * 生の文字列をそのまま paragraph として流し込むと「# 見出し」が
 * そのまま表示される（MD 崩れ）ため、挿入時は必ずこの変換を通す。
 *
 * 失敗時は空配列を返す（呼び出し側はフォールバックを用意すること）。
 */
export function markdownToNodes(editor: Editor, markdown: string): PMNode[] {
  try {
    const storage = (editor as unknown as {
      storage?: { markdown?: { parser?: { parse: (md: string) => string } } }
    }).storage
    const parser = storage?.markdown?.parser
    if (!parser) throw new Error("tiptap-markdown parser not found")

    const html = parser.parse(markdown)
    const dom = new window.DOMParser().parseFromString(`<div>${html}</div>`, "text/html")
    const fragment = DOMParser.fromSchema(editor.schema).parse(dom.body)

    const nodes: PMNode[] = []
    fragment.forEach((node) => nodes.push(node))
    return nodes
  } catch (err) {
    console.warn("[markdownToNodes] Markdown 変換に失敗しました", err)
    return []
  }
}

/**
 * ストリーミング挿入用の軽量ブロック変換。
 * 生成中は Markdown が部分的なため、行頭記号（# / - / > / 数字.）から
 * それらしいブロックへ即時変換して表示する。
 * 精度は完全ではないため、生成完了後に `markdownToNodes` で
 * 挿入範囲全体を再パースして確定させる（AIAssistPanel 側で実施）。
 */
export function streamMarkdownToNodes(editor: Editor, text: string): PMNode[] {
  const schema = editor.schema
  const blocks: PMNode[] = []
  let paraLines: string[] = []

  const flushPara = () => {
    if (paraLines.length === 0) return
    const children: PMNode[] = []
    paraLines.forEach((line, i) => {
      if (i > 0) children.push(schema.node("hardBreak"))
      children.push(schema.text(line))
    })
    blocks.push(schema.node("paragraph", {}, children))
    paraLines = []
  }

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd()
    const trimmed = line.trim()
    if (!trimmed) {
      flushPara()
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushPara()
      const level = Math.min(heading[1].length, 3) as 1 | 2 | 3
      blocks.push(schema.node("heading", { level }, schema.text(heading[2].trim())))
      continue
    }

    const quote = trimmed.match(/^>\s?(.*)$/)
    if (quote) {
      flushPara()
      blocks.push(
        schema.node(
          "blockquote",
          {},
          schema.node("paragraph", {}, schema.text(quote[1]))
        )
      )
      continue
    }

    const bullet = trimmed.match(/^[-*+]\s+(.*)$/)
    if (bullet) {
      flushPara()
      blocks.push(
        schema.node(
          "bulletList",
          {},
          schema.node("listItem", {}, schema.node("paragraph", {}, schema.text(bullet[1])))
        )
      )
      continue
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.*)$/)
    if (ordered) {
      flushPara()
      blocks.push(
        schema.node(
          "orderedList",
          {},
          schema.node("listItem", {}, schema.node("paragraph", {}, schema.text(ordered[1])))
        )
      )
      continue
    }

    paraLines.push(line)
  }
  flushPara()

  return blocks
}
