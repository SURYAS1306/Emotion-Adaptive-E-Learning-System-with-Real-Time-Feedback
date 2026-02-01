/**
 * CodeEditor component using Monaco Editor.
 * Provides a LeetCode-style code editing experience with syntax highlighting,
 * auto-completion, and language support.
 * 
 * Integrates with the Emotion-Adaptive E-Learning System for real-time
 * code analysis and adaptive feedback.
 */

import { useRef, useCallback } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
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

/**
 * Monaco language mapping
 */
const languageMap: Record<ProgrammingLanguage, string> = {
  javascript: "javascript",
  python: "python",
  typescript: "typescript",
};

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "400px",
  theme = "vs-dark",
  fontSize = 14,
  showLineNumbers = true,
  showMinimap = false,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    // Focus editor on mount
    editor.focus();
  }, []);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      onChange(newValue || "");
    },
    [onChange]
  );

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Editor
        height={height}
        language={languageMap[language]}
        value={value}
        theme={theme}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          fontSize,
          lineNumbers: showLineNumbers ? "on" : "off",
          minimap: { enabled: showMinimap },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: language === "python" ? 4 : 2,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          folding: true,
          foldingHighlight: true,
          bracketPairColorization: { enabled: true },
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          contextmenu: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
              <span>Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
}

export default CodeEditor;
