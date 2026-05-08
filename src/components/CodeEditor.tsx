/**
 * CodeEditor component fallback using a textarea.
 * This keeps the coding flow usable when Monaco is unavailable.
 */

import type { ProgrammingLanguage } from "@/data/codingProblems";

interface CodeEditorProps {
  /** Current code content */
  value: string;
  /** Callback when code changes */
  onChange: (value: string) => void;
  /** Programming language for syntax highlighting */
  language: ProgrammingLanguage;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Height of the editor */
  height?: string;
  /** Theme: 'vs-dark' or 'light' */
  theme?: "vs-dark" | "light";
  /** Font size in pixels */
  fontSize?: number;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Show minimap */
  showMinimap?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "100%",
  theme = "vs-dark",
  fontSize = 14,
  showLineNumbers = true,
  showMinimap = false,
}: CodeEditorProps) {
  void language;
  void showLineNumbers;
  void showMinimap;

  const isDark = theme === "vs-dark";

  return (
    <div
      className={`h-full w-full min-h-0 rounded-lg overflow-hidden border border-border ${
        isDark ? "bg-[#1e1e1e]" : "bg-background"
      }`}
      style={{ height }}
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        placeholder="Write your code here..."
        spellCheck={false}
        className={`block h-full w-full min-h-0 resize-none overflow-auto p-3 font-mono leading-6 outline-none ${
          isDark
            ? "bg-transparent text-white placeholder:text-zinc-500"
            : "bg-transparent text-foreground placeholder:text-muted-foreground"
        }`}
        style={{ fontSize }}
      />
    </div>
  );
}

export default CodeEditor;
