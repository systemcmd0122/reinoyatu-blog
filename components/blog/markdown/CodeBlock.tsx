"use client"

import React, { useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Clipboard, Check } from "lucide-react"

interface CodeBlockProps {
  language?: string
  code: string
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // フォールバック
    }
  }

  const displayLang = language === "text" || !language ? "" : language

  return (
    <div className="not-prose my-6 rounded-xl overflow-hidden border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          {displayLang && (
            <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-[0.12em]">
              {displayLang}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#8b949e] hover:text-white rounded-md hover:bg-white/10 transition-all duration-150 active:scale-95"
          aria-label="コードをコピー"
        >
          {isCopied
            ? <><Check size={12} className="text-[#3fb950]" /><span className="text-[#3fb950]">コピー済み</span></>
            : <><Clipboard size={12} /><span>コピー</span></>
          }
        </button>
      </div>

      <div
        className="overflow-x-auto"
        style={{
          background: "#0d1117",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.1) transparent",
        }}
      >
        <SyntaxHighlighter
          style={oneDark}
          language={language || "text"}
          PreTag="div"
          showLineNumbers
          lineNumberStyle={{
            minWidth: "3em",
            paddingRight: "1.2em",
            color: "rgba(255,255,255,0.18)",
            textAlign: "right",
            userSelect: "none",
            fontSize: "12px",
          }}
          customStyle={{
            margin: 0,
            padding: "1rem 1.25rem",
            fontSize: "13.5px",
            lineHeight: "1.65",
            background: "transparent",
            fontFamily:
              '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          }}
          codeTagProps={{
            style: {
              fontFamily: "inherit",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export default CodeBlock
