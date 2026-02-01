/**
 * Learning content and quiz data for the Emotion-Adaptive E-Learning System.
 */

export type DifficultyLevel = "easy" | "medium" | "hard";

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: DifficultyLevel;
  explanation: string;
  hint: string;
  topicId: string;
}

export const learningTopics: LearningTopic[] = [
  {
    id: "emotion-detection",
    title: "Introduction to Emotion Detection",
    description: "Understanding how AI systems detect and classify human emotions",
    content: `Emotion detection is a subfield of affective computing that enables machines to recognize and interpret human emotional states. In e-learning systems, emotion detection typically uses:

**1. Facial Expression Analysis** - Computer vision models analyze facial landmarks, muscle movements (Action Units), and expressions. Common emotions detected include: happiness, sadness, anger, surprise, fear, and neutrality.

**2. Text Sentiment Analysis** - Natural language processing techniques extract emotional cues from written text. This is particularly useful for chat-based interfaces and forum discussions.

**3. Gaze & Attention Tracking** - Eye-tracking and head pose estimation help infer engagement levels and cognitive load. Sustained attention vs. distraction can indicate boredom or confusion.

**4. Physiological Signals** (advanced) - Heart rate, skin conductance, and EEG can provide deeper emotion signals but require additional hardware.

The fusion of multiple modalities (face + text + gaze) typically yields higher accuracy than single-modality approaches.`,
    keyPoints: [
      "Emotion detection uses face, text, and gaze signals",
      "Multi-modal fusion improves accuracy",
      "Common emotions: happy, sad, angry, surprised, fear, disgust, neutral",
      "E-learning applications focus on engagement, frustration, and confusion",
    ],
    estimatedMinutes: 8,
  },
  {
    id: "adaptive-learning",
    title: "Adaptive Learning Engines",
    description: "How systems adjust content based on learner state",
    content: `Adaptive learning engines dynamically modify the learning experience based on real-time signals. Key adaptation strategies include:

**Difficulty Adjustment** - When frustration or confusion is high, the system reduces question difficulty or offers simpler explanations. When the learner shows high engagement and success, it increases challenge to maintain flow state.

**Pace Control** - Slowing down content delivery when cognitive load is high, or accelerating when the learner is bored and performing well.

**Hint & Explanation System** - Providing contextual hints when confusion is detected, and fuller explanations when repeated failures occur.

**Break Recommendations** - Suggesting short breaks when sustained negative affect (frustration, fatigue) is detected, to prevent overload and support retention.

Research shows that emotion-adaptive systems can improve engagement by 25-40% compared to static curricula.`,
    keyPoints: [
      "Adapt difficulty based on frustration and performance",
      "Pace content to match cognitive load",
      "Provide hints when confusion is detected",
      "Emotion-adaptive systems show 25-40% engagement gains",
    ],
    estimatedMinutes: 10,
  },
  {
    id: "engagement-metrics",
    title: "Engagement & Cognitive Load Metrics",
    description: "Quantifying learner engagement for research and adaptation",
    content: `Engagement and cognitive load are composite metrics derived from multiple signals:

**Engagement Score** - Typically computed as a weighted combination of attention level, interaction frequency, emotional valence, and performance trends.

**Frustration Level** - Indicated by: furrowed brows, frowns, repeated wrong answers, negative sentiment in text, rapid clicking or abandonment.

**Boredom Level** - Indicated by: yawning, looking away, slow response times, minimal interaction, high performance with low effort.

**Cognitive Load** - Inferred from: time-on-task, error rates, need for hints, physiological stress indicators. High load suggests content is too complex or dense.

These metrics are logged for research benchmarking and to drive real-time adaptation decisions.`,
    keyPoints: [
      "Engagement = attention + interaction + emotion + performance",
      "Frustration: negative affect + repeated errors",
      "Boredom: disengagement + high performance with low effort",
      "Metrics support research and real-time adaptation",
    ],
    estimatedMinutes: 7,
  },
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question:
      "Which of the following is NOT typically used for emotion detection in e-learning?",
    options: [
      "Facial expression analysis",
      "Text sentiment analysis",
      "Gaze and attention tracking",
      "Keyboard typing speed only",
    ],
    correctIndex: 3,
    difficulty: "easy",
    explanation:
      "Keyboard typing speed alone is rarely used for emotion detection. Face, text, and gaze are standard modalities.",
    hint: "Think about which modality requires the least additional sensors or models.",
    topicId: "emotion-detection",
  },
  {
    id: "q2",
    question:
      "When a learner shows high frustration and low attention, an adaptive system should typically:",
    options: [
      "Increase question difficulty",
      "Reduce difficulty and offer hints",
      "Recommend a longer break",
      "Both B and C",
    ],
    correctIndex: 3,
    difficulty: "medium",
    explanation:
      "High frustration + low attention indicates overload. The system should ease difficulty, provide hints, and may suggest a break.",
    hint: "Frustration and low attention suggest the learner is struggling. What would help?",
    topicId: "adaptive-learning",
  },
  {
    id: "q3",
    question: 'What does "multi-modal fusion" mean in emotion detection?',
    options: [
      "Using multiple AI models for the same input",
      "Combining face, text, and gaze signals for better accuracy",
      "Fusing different learning topics together",
      "Merging student data from multiple classes",
    ],
    correctIndex: 1,
    difficulty: "medium",
    explanation:
      "Multi-modal fusion combines different input channels to produce a more robust emotion estimate than any single modality.",
    hint: 'Think about different "modes" or channels of input.',
    topicId: "emotion-detection",
  },
  {
    id: "q4",
    question:
      "An engagement score in emotion-adaptive systems is typically based on:",
    options: [
      "Only facial expressions",
      "Attention, interaction, emotion, and performance",
      "Number of correct answers only",
      "Time spent on the platform only",
    ],
    correctIndex: 1,
    difficulty: "easy",
    explanation:
      "Engagement is a composite metric combining attention (gaze), interaction frequency, emotional valence, and performance trends.",
    hint: "Engagement is holistic—consider multiple factors.",
    topicId: "engagement-metrics",
  },
  {
    id: "q5",
    question:
      "Research suggests emotion-adaptive e-learning can improve engagement by approximately:",
    options: ["5-10%", "25-40%", "60-80%", "90-100%"],
    correctIndex: 1,
    difficulty: "hard",
    explanation:
      "Studies report engagement improvements in the 25-40% range for emotion-adaptive systems compared to static curricula.",
    hint: "The improvement is significant but not extreme. Think moderate gains.",
    topicId: "adaptive-learning",
  },
  {
    id: "q6",
    question: "High boredom in a learner is often indicated by:",
    options: [
      "Rapid wrong answers and frowns",
      "Looking away, slow responses, high performance with low effort",
      "Frequent hint requests",
      "Short session duration only",
    ],
    correctIndex: 1,
    difficulty: "medium",
    explanation:
      "Boredom correlates with disengagement (looking away), slow responses, and paradoxically high performance with minimal effort.",
    hint: "Boredom = under-stimulated. What would that look like?",
    topicId: "engagement-metrics",
  },
  {
    id: "q7",
    question:
      'Which emotion is commonly included in the "basic" set used by many facial emotion models?',
    options: ["Jealousy", "Pride", "Surprise", "Guilt"],
    correctIndex: 2,
    difficulty: "easy",
    explanation:
      "The classic basic emotions (Ekman) include: happiness, sadness, anger, surprise, fear, disgust. Surprise is one of them.",
    hint: "Think of the classic set studied in psychology.",
    topicId: "emotion-detection",
  },
  {
    id: "q8",
    question:
      "When should an adaptive system consider increasing question difficulty?",
    options: [
      "When the learner is frustrated",
      "When the learner is bored and performing well",
      "When the learner requests more challenge",
      "Both B and C",
    ],
    correctIndex: 3,
    difficulty: "hard",
    explanation:
      "Increasing difficulty is appropriate when the learner is bored (under-challenged) and performing well, or when they explicitly request more challenge.",
    hint: "Increase difficulty when the learner is ready for more, not when struggling.",
    topicId: "adaptive-learning",
  },
];
