/**
 * CodingTest Page - LeetCode-style coding interface
 * 
 * Features:
 * - Problem description with examples and constraints
 * - Monaco-based code editor with multiple language support
 * - Test case execution and results
 * - Emotion-adaptive hints and difficulty adjustment
 * - Progress tracking and performance analytics
 * 
 * This component integrates with the Emotion Intelligence Engine
 * to provide adaptive learning during coding challenges.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  FileText,
  TestTube,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Eye,
  EyeOff,
  Trophy,
  AlertCircle,
  Sparkles,
  BookOpen,
  Timer,
  Target,
} from "lucide-react";
import { useEmotionContext } from "@/contexts/EmotionContext";
import { useEmotionStream } from "@/domain/emotion/useEmotionStream";
import EmotionCamera from "@/components/EmotionCamera";
import CodeEditor from "@/components/CodeEditor";
import EmotionMetrics, { getSuggestedDifficulty } from "@/components/EmotionMetrics";
import {
  codingProblems,
  type CodingProblem,
  type ProgrammingLanguage,
  type DifficultyLevel,
  type TestCase,
  getAdaptiveProblem,
} from "@/data/codingProblems";
import type { EmotionType } from "@/types/emotion";

// ============ Types ============

interface TestResult {
  testCaseId: string;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
  executionTime?: number;
}

interface SubmissionResult {
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: TestResult[];
  executionTime: number;
}

// ============ Helper Functions ============

const getDifficultyColor = (d: DifficultyLevel) => {
  switch (d) {
    case "easy":
      return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40";
    case "medium":
      return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40";
    case "hard":
      return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40";
  }
};

const getDifficultyLabel = (d: DifficultyLevel) => {
  return d.charAt(0).toUpperCase() + d.slice(1);
};

/**
 * Simple JavaScript code executor for test cases.
 * In production, this would be a secure sandbox or backend service.
 */
function executeJavaScriptCode(
  code: string,
  testCase: TestCase,
  functionName: string
): TestResult {
  const startTime = performance.now();
  
  try {
    const input = JSON.parse(testCase.input);
    
    // Create a sandboxed function
    const wrappedCode = `
      ${code}
      return ${functionName}(...Object.values(arguments[0]));
    `;
    
    // eslint-disable-next-line no-new-func
    const fn = new Function(wrappedCode);
    const result = fn(input);
    
    const executionTime = performance.now() - startTime;
    const actualOutput = JSON.stringify(result);
    const expectedOutput = testCase.expectedOutput;
    
    // Normalize for comparison
    const normalizedActual = actualOutput.replace(/\s/g, "");
    const normalizedExpected = expectedOutput.replace(/\s/g, "");
    
    const passed = normalizedActual === normalizedExpected;
    
    return {
      testCaseId: testCase.id,
      passed,
      input: testCase.input,
      expected: expectedOutput,
      actual: actualOutput,
      executionTime,
    };
  } catch (error) {
    return {
      testCaseId: testCase.id,
      passed: false,
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: "",
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: performance.now() - startTime,
    };
  }
}

/**
 * Get the main function name from the problem's starter code
 */
function getFunctionName(code: string, language: ProgrammingLanguage): string {
  if (language === "javascript" || language === "typescript") {
    const match = code.match(/function\s+(\w+)/);
    return match ? match[1] : "solution";
  }
  if (language === "python") {
    const match = code.match(/def\s+(\w+)/);
    return match ? match[1] : "solution";
  }
  return "solution";
}

// ============ Main Component ============

export default function CodingTest() {
  // Emotion context
  const { currentEmotion, setCurrentEmotion } = useEmotionContext();
  const { state: unifiedEmotionState } = useEmotionStream(currentEmotion, {
    faceStreamActive: true,
    enableStreaming: true,
    mode: "adaptive",
  });

  // Problem state
  const [selectedProblemId, setSelectedProblemId] = useState(codingProblems[0]?.id || "");
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(new Set());
  
  // Editor state
  const [language, setLanguage] = useState<ProgrammingLanguage>("javascript");
  const [code, setCode] = useState("");
  
  // UI state
  const [showProblemList, setShowProblemList] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "solution">("description");
  const [bottomTab, setBottomTab] = useState<"testcases" | "results">("testcases");
  
  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  
  // Timer state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Stats
  const [wrongAttempts, setWrongAttempts] = useState(0);

  // Current problem
  const currentProblem = useMemo(
    () => codingProblems.find((p) => p.id === selectedProblemId),
    [selectedProblemId]
  );

  // Emotion-based adaptation
  const highFrustration = unifiedEmotionState.frustration > 0.6;
  const lowEngagement = unifiedEmotionState.engagement < 0.4;
  const suggestHint = highFrustration || wrongAttempts >= 2;
  const suggestEasier = highFrustration && wrongAttempts >= 3;

  // Initialize code when problem or language changes
  useEffect(() => {
    if (currentProblem) {
      setCode(currentProblem.starterCode[language]);
      setTestResults([]);
      setSubmissionResult(null);
      setShowHints(false);
      setCurrentHintIndex(0);
      setShowSolution(false);
      setWrongAttempts(0);
      setStartTime(Date.now());
    }
  }, [currentProblem, language]);

  // Timer effect
  useEffect(() => {
    if (startTime && !completedProblems.has(selectedProblemId)) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, selectedProblemId, completedProblems]);

  // Emotion class effect
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      "emotion-happy", "emotion-sad", "emotion-angry",
      "emotion-surprised", "emotion-fear", "emotion-disgust", "emotion-neutral"
    );
    root.classList.add(`emotion-${currentEmotion}`);
  }, [currentEmotion]);

  // Auto-show hints when frustrated
  useEffect(() => {
    if (suggestHint && !showHints && currentProblem && currentProblem.hints.length > 0) {
      setShowHints(true);
    }
  }, [suggestHint, showHints, currentProblem]);

  const handleEmotionDetected = (emotion: EmotionType) => {
    setCurrentEmotion(emotion);
  };

  const handleRunCode = useCallback(async () => {
    if (!currentProblem) return;
    
    setIsRunning(true);
    setBottomTab("results");
    
    // Simulate slight delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const functionName = getFunctionName(currentProblem.starterCode[language], language);
    const visibleTests = currentProblem.testCases.filter((tc) => !tc.isHidden);
    
    const results = visibleTests.map((tc) =>
      executeJavaScriptCode(code, tc, functionName)
    );
    
    setTestResults(results);
    setIsRunning(false);
  }, [currentProblem, code, language]);

  const handleSubmit = useCallback(async () => {
    if (!currentProblem) return;
    
    setIsSubmitting(true);
    setBottomTab("results");
    
    // Simulate submission delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const functionName = getFunctionName(currentProblem.starterCode[language], language);
    const allTests = currentProblem.testCases;
    
    const startTime = performance.now();
    const results = allTests.map((tc) =>
      executeJavaScriptCode(code, tc, functionName)
    );
    const executionTime = performance.now() - startTime;
    
    const passedTests = results.filter((r) => r.passed).length;
    const success = passedTests === allTests.length;
    
    const submission: SubmissionResult = {
      success,
      totalTests: allTests.length,
      passedTests,
      results,
      executionTime,
    };
    
    setSubmissionResult(submission);
    setTestResults(results);
    
    if (success) {
      setCompletedProblems((prev) => new Set(prev).add(currentProblem.id));
    } else {
      setWrongAttempts((prev) => prev + 1);
    }
    
    setIsSubmitting(false);
  }, [currentProblem, code, language]);

  const handleReset = () => {
    if (currentProblem) {
      setCode(currentProblem.starterCode[language]);
      setTestResults([]);
      setSubmissionResult(null);
    }
  };

  const handleNextHint = () => {
    if (currentProblem && currentHintIndex < currentProblem.hints.length - 1) {
      setCurrentHintIndex((prev) => prev + 1);
    }
  };

  const handleSelectProblem = (problemId: string) => {
    setSelectedProblemId(problemId);
  };

  const handleNextProblem = () => {
    // Use emotion-adaptive selection
    const nextProblem = getAdaptiveProblem(
      currentProblem?.difficulty || "easy",
      unifiedEmotionState.frustration,
      unifiedEmotionState.engagement,
      Array.from(completedProblems)
    );
    
    if (nextProblem) {
      setSelectedProblemId(nextProblem.id);
    }
  };

  /**
   * Handle difficulty suggestion from EmotionMetrics component.
   * Finds a problem at the suggested difficulty and switches to it.
   */
  const handleSuggestedDifficulty = (difficulty: DifficultyLevel) => {
    // Find an uncompleted problem at the suggested difficulty
    const availableProblems = codingProblems.filter(
      (p) => p.difficulty === difficulty && !completedProblems.has(p.id)
    );
    
    if (availableProblems.length > 0) {
      // Pick a random one from available problems
      const randomIndex = Math.floor(Math.random() * availableProblems.length);
      setSelectedProblemId(availableProblems[randomIndex].id);
    } else {
      // If all problems at that difficulty are completed, try any uncompleted
      const anyUncompleted = codingProblems.find(
        (p) => !completedProblems.has(p.id)
      );
      if (anyUncompleted) {
        setSelectedProblemId(anyUncompleted.id);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No problems available.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background emotion-transition">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link to="/learn">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProblemList(!showProblemList)}
            className="gap-2"
          >
            {showProblemList ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Problems
          </Button>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(currentProblem.difficulty)}>
              {getDifficultyLabel(currentProblem.difficulty)}
            </Badge>
            <h1 className="font-semibold text-lg hidden sm:block">
              {currentProblem.title}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
          
          {/* Emotion indicators */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {currentEmotion}
            </Badge>
            <span>Eng: {Math.round(unifiedEmotionState.engagement * 100)}%</span>
            <span>Frust: {Math.round(unifiedEmotionState.frustration * 100)}%</span>
          </div>
          
          {/* Language selector */}
          <Select value={language} onValueChange={(v) => setLanguage(v as ProgrammingLanguage)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem list sidebar */}
        {showProblemList && (
          <aside className="w-64 border-r shrink-0 flex flex-col">
            <div className="p-3 border-b">
              <h2 className="font-semibold text-sm">Problem List</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {completedProblems.size} / {codingProblems.length} completed
              </p>
              <Progress
                value={(completedProblems.size / codingProblems.length) * 100}
                className="h-1.5 mt-2"
              />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {codingProblems.map((problem) => (
                  <button
                    key={problem.id}
                    onClick={() => handleSelectProblem(problem.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors ${
                      problem.id === selectedProblemId
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {completedProblems.has(problem.id) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border shrink-0" />
                    )}
                    <span className="flex-1 truncate">{problem.title}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1 py-0 ${getDifficultyColor(problem.difficulty)}`}
                    >
                      {problem.difficulty[0].toUpperCase()}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
            
            {/* Emotion panel in sidebar */}
            <div className="p-2 border-t space-y-3">
              <EmotionCamera onEmotionDetected={handleEmotionDetected} compact />
              <EmotionMetrics
                emotionState={unifiedEmotionState}
                currentEmotion={currentEmotion}
                currentDifficulty={currentProblem?.difficulty}
                onSuggestDifficulty={handleSuggestedDifficulty}
                showSuggestion={true}
                compact
              />
            </div>
          </aside>
        )}

        {/* Main panels */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Problem description panel */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <div className="h-full flex flex-col">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "description" | "solution")} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b h-10 px-2">
                  <TabsTrigger value="description" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="solution" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    Solution
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-6">
                      {/* Title and metadata */}
                      <div>
                        <h2 className="text-2xl font-bold">{currentProblem.title}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={getDifficultyColor(currentProblem.difficulty)}>
                            {getDifficultyLabel(currentProblem.difficulty)}
                          </Badge>
                          <Badge variant="outline">{currentProblem.category}</Badge>
                          {currentProblem.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            ~{currentProblem.estimatedMinutes} min
                          </span>
                          {currentProblem.acceptanceRate && (
                            <span className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />
                              {currentProblem.acceptanceRate}% acceptance
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Emotion-adaptive message */}
                      {suggestEasier && (
                        <Card className="p-3 border-amber-500/30 bg-amber-500/10">
                          <div className="flex items-start gap-2">
                            <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-amber-800 dark:text-amber-200">
                                Would you like to try an easier problem?
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                It seems like you might be struggling. That's okay!
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={handleNextProblem}
                              >
                                Suggest a Problem
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Description */}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap">{currentProblem.description}</div>
                      </div>

                      {/* Examples */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Examples</h3>
                        {currentProblem.examples.map((example, idx) => (
                          <Card key={idx} className="p-4 bg-muted/50">
                            <div className="space-y-2">
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Input:</span>
                                <pre className="mt-1 text-sm font-mono bg-background p-2 rounded">
                                  {example.input}
                                </pre>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Output:</span>
                                <pre className="mt-1 text-sm font-mono bg-background p-2 rounded">
                                  {example.output}
                                </pre>
                              </div>
                              {example.explanation && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Explanation:</span>
                                  <p className="mt-1 text-sm">{example.explanation}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>

                      {/* Constraints */}
                      <div className="space-y-2">
                        <h3 className="font-semibold">Constraints</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {currentProblem.constraints.map((c, idx) => (
                            <li key={idx} className="font-mono text-xs">{c}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Hints section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Hints
                            {suggestHint && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHints(!showHints)}
                          >
                            {showHints ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {showHints && currentProblem.hints.length > 0 && (
                          <Card className="p-4 bg-amber-500/10 border-amber-500/30">
                            <p className="text-sm">
                              <span className="font-medium">Hint {currentHintIndex + 1}:</span>{" "}
                              {currentProblem.hints[currentHintIndex]}
                            </p>
                            {currentHintIndex < currentProblem.hints.length - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={handleNextHint}
                              >
                                Next Hint ({currentHintIndex + 1}/{currentProblem.hints.length})
                              </Button>
                            )}
                          </Card>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="solution" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Solution</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSolution(!showSolution)}
                        >
                          {showSolution ? "Hide" : "Show"} Solution
                        </Button>
                      </div>
                      {showSolution ? (
                        currentProblem.solution?.[language] ? (
                          <div className="rounded-lg overflow-hidden border">
                            <CodeEditor
                              value={currentProblem.solution[language]}
                              onChange={() => {}}
                              language={language}
                              readOnly
                              height="300px"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Solution not available for this language.
                          </p>
                        )
                      ) : (
                        <Card className="p-4 bg-muted/50 text-center">
                          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Try solving the problem first! Click "Show Solution" when you're ready.
                          </p>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Code editor and results panel */}
          <ResizablePanel defaultSize={60} minSize={35}>
            <ResizablePanelGroup direction="vertical">
              {/* Code editor */}
              <ResizablePanel defaultSize={65} minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="h-10 border-b flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Code</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleReset}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reset Code</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex-1">
                    <CodeEditor
                      value={code}
                      onChange={setCode}
                      language={language}
                      height="100%"
                      showMinimap={false}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Test cases and results */}
              <ResizablePanel defaultSize={35} minSize={20}>
                <div className="h-full flex flex-col">
                  <Tabs value={bottomTab} onValueChange={(v) => setBottomTab(v as "testcases" | "results")} className="flex-1 flex flex-col">
                    <div className="h-10 border-b flex items-center justify-between px-3">
                      <TabsList className="h-8">
                        <TabsTrigger value="testcases" className="text-xs gap-1 h-7 px-2">
                          <TestTube className="h-3.5 w-3.5" />
                          Test Cases
                        </TabsTrigger>
                        <TabsTrigger value="results" className="text-xs gap-1 h-7 px-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Results
                          {testResults.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                              {testResults.filter((r) => r.passed).length}/{testResults.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRunCode}
                          disabled={isRunning || isSubmitting}
                          className="gap-1"
                        >
                          {isRunning ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                          Run
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSubmit}
                          disabled={isRunning || isSubmitting}
                          className="gap-1"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          Submit
                        </Button>
                      </div>
                    </div>
                    
                    <TabsContent value="testcases" className="flex-1 m-0 overflow-hidden">
                      <ScrollArea className="h-full">
                        <div className="p-3 space-y-3">
                          {currentProblem.testCases
                            .filter((tc) => !tc.isHidden)
                            .map((tc, idx) => (
                              <Card key={tc.id} className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Case {idx + 1}</span>
                                  {tc.explanation && (
                                    <span className="text-xs text-muted-foreground">
                                      {tc.explanation}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-xs text-muted-foreground">Input:</span>
                                    <pre className="text-xs font-mono bg-muted p-2 rounded mt-1 overflow-x-auto">
                                      {tc.input}
                                    </pre>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground">Expected:</span>
                                    <pre className="text-xs font-mono bg-muted p-2 rounded mt-1 overflow-x-auto">
                                      {tc.expectedOutput}
                                    </pre>
                                  </div>
                                </div>
                              </Card>
                            ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="results" className="flex-1 m-0 overflow-hidden">
                      <ScrollArea className="h-full">
                        <div className="p-3 space-y-3">
                          {/* Submission result banner */}
                          {submissionResult && (
                            <Card
                              className={`p-4 ${
                                submissionResult.success
                                  ? "border-green-500/30 bg-green-500/10"
                                  : "border-red-500/30 bg-red-500/10"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {submissionResult.success ? (
                                  <Trophy className="h-8 w-8 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-8 w-8 text-red-500" />
                                )}
                                <div>
                                  <p className="font-semibold text-lg">
                                    {submissionResult.success ? "Accepted!" : "Wrong Answer"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {submissionResult.passedTests}/{submissionResult.totalTests} test cases passed
                                    {" · "}
                                    {submissionResult.executionTime.toFixed(2)}ms
                                  </p>
                                </div>
                              </div>
                              {submissionResult.success && (
                                <Button
                                  className="mt-3"
                                  onClick={handleNextProblem}
                                >
                                  Next Problem
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              )}
                            </Card>
                          )}
                          
                          {/* Individual test results */}
                          {testResults.length > 0 ? (
                            testResults.map((result, idx) => (
                              <Card
                                key={result.testCaseId}
                                className={`p-3 ${
                                  result.passed
                                    ? "border-green-500/30"
                                    : "border-red-500/30"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {result.passed ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-sm font-medium">
                                    Test Case {idx + 1}
                                  </span>
                                  {result.executionTime && (
                                    <span className="text-xs text-muted-foreground">
                                      {result.executionTime.toFixed(2)}ms
                                    </span>
                                  )}
                                </div>
                                {result.error ? (
                                  <pre className="text-xs font-mono text-red-500 bg-red-500/10 p-2 rounded overflow-x-auto">
                                    Error: {result.error}
                                  </pre>
                                ) : !result.passed ? (
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Expected:</span>
                                      <pre className="font-mono bg-muted p-2 rounded mt-1 overflow-x-auto">
                                        {result.expected}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Output:</span>
                                      <pre className="font-mono bg-muted p-2 rounded mt-1 overflow-x-auto">
                                        {result.actual || "(empty)"}
                                      </pre>
                                    </div>
                                  </div>
                                ) : null}
                              </Card>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Run your code to see results</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
