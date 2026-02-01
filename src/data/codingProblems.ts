/**
 * Coding problems data for the LeetCode-style Coding Test section.
 * Problems are categorized by difficulty and include test cases for validation.
 * 
 * This module supports the Emotion-Adaptive E-Learning System by providing
 * coding challenges that can adapt based on student's emotional state.
 */

export type DifficultyLevel = "easy" | "medium" | "hard";
export type ProgrammingLanguage = "javascript" | "python" | "typescript";

/**
 * Represents a test case for validating code submissions.
 */
export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean; // Hidden test cases for final validation
  explanation?: string;
}

/**
 * Represents a coding problem with all necessary information.
 */
export interface CodingProblem {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  category: string;
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  hints: string[];
  starterCode: Record<ProgrammingLanguage, string>;
  testCases: TestCase[];
  solution?: Record<ProgrammingLanguage, string>; // For learning purposes
  timeLimit: number; // in milliseconds
  memoryLimit: number; // in MB
  tags: string[];
  /** Estimated time to solve in minutes */
  estimatedMinutes: number;
  /** Number of successful submissions (for display) */
  acceptanceRate?: number;
}

/**
 * Collection of coding problems organized by difficulty.
 * These problems are designed to test algorithmic thinking and coding skills
 * while integrating with the emotion-adaptive learning system.
 */
export const codingProblems: CodingProblem[] = [
  // ============ EASY PROBLEMS ============
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    category: "Arrays",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
      },
      {
        input: "nums = [3, 3], target = 6",
        output: "[0, 1]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    hints: [
      "A brute force approach would be to check every pair of numbers.",
      "Can you think of a way to find the complement of each number efficiently?",
      "Consider using a hash map to store numbers you've seen and their indices.",
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your solution here
    
}`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    """
    Find two numbers that add up to target.
    
    Args:
        nums: List of integers
        target: Target sum
    
    Returns:
        Indices of the two numbers
    """
    # Write your solution here
    pass`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
    // Write your solution here
    
}`,
    },
    testCases: [
      {
        id: "tc1",
        input: JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }),
        expectedOutput: JSON.stringify([0, 1]),
        explanation: "Basic case with two numbers at start",
      },
      {
        id: "tc2",
        input: JSON.stringify({ nums: [3, 2, 4], target: 6 }),
        expectedOutput: JSON.stringify([1, 2]),
      },
      {
        id: "tc3",
        input: JSON.stringify({ nums: [3, 3], target: 6 }),
        expectedOutput: JSON.stringify([0, 1]),
        explanation: "Same numbers case",
      },
      {
        id: "tc4",
        input: JSON.stringify({ nums: [1, 5, 8, 3, 9, 2], target: 11 }),
        expectedOutput: JSON.stringify([2, 3]),
        isHidden: true,
      },
      {
        id: "tc5",
        input: JSON.stringify({ nums: [-1, -2, -3, -4, -5], target: -8 }),
        expectedOutput: JSON.stringify([2, 4]),
        isHidden: true,
        explanation: "Negative numbers case",
      },
    ],
    solution: {
      javascript: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement)!, i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
    },
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ["Array", "Hash Table"],
    estimatedMinutes: 15,
    acceptanceRate: 78,
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "easy",
    category: "Strings",
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array **in-place** with O(1) extra memory.`,
    examples: [
      {
        input: 's = ["h", "e", "l", "l", "o"]',
        output: '["o", "l", "l", "e", "h"]',
      },
      {
        input: 's = ["H", "a", "n", "n", "a", "h"]',
        output: '["h", "a", "n", "n", "a", "H"]',
      },
    ],
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character.",
    ],
    hints: [
      "The entire logic for reversing a string is based on using the opposite directional two-pointer approach!",
      "Try swapping characters from both ends moving towards the middle.",
    ],
    starterCode: {
      javascript: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
function reverseString(s) {
    // Write your solution here
    
}`,
      python: `def reverse_string(s: list[str]) -> None:
    """
    Reverse the string in-place.
    
    Args:
        s: List of characters to reverse
    """
    # Write your solution here
    pass`,
      typescript: `/**
 * Do not return anything, modify s in-place instead.
 */
function reverseString(s: string[]): void {
    // Write your solution here
    
}`,
    },
    testCases: [
      {
        id: "tc1",
        input: JSON.stringify({ s: ["h", "e", "l", "l", "o"] }),
        expectedOutput: JSON.stringify(["o", "l", "l", "e", "h"]),
      },
      {
        id: "tc2",
        input: JSON.stringify({ s: ["H", "a", "n", "n", "a", "h"] }),
        expectedOutput: JSON.stringify(["h", "a", "n", "n", "a", "H"]),
      },
      {
        id: "tc3",
        input: JSON.stringify({ s: ["a"] }),
        expectedOutput: JSON.stringify(["a"]),
        isHidden: true,
      },
      {
        id: "tc4",
        input: JSON.stringify({ s: ["a", "b"] }),
        expectedOutput: JSON.stringify(["b", "a"]),
        isHidden: true,
      },
    ],
    solution: {
      javascript: `function reverseString(s) {
    let left = 0, right = s.length - 1;
    while (left < right) {
        [s[left], s[right]] = [s[right], s[left]];
        left++;
        right--;
    }
}`,
      python: `def reverse_string(s: list[str]) -> None:
    left, right = 0, len(s) - 1
    while left < right:
        s[left], s[right] = s[right], s[left]
        left += 1
        right -= 1`,
      typescript: `function reverseString(s: string[]): void {
    let left = 0, right = s.length - 1;
    while (left < right) {
        [s[left], s[right]] = [s[right], s[left]];
        left++;
        right--;
    }
}`,
    },
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ["Two Pointers", "String"],
    estimatedMinutes: 10,
    acceptanceRate: 85,
  },
  {
    id: "palindrome-number",
    title: "Palindrome Number",
    difficulty: "easy",
    category: "Math",
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a **palindrome**, and \`false\` otherwise.

An integer is a **palindrome** when it reads the same backward as forward.

- For example, \`121\` is a palindrome while \`123\` is not.`,
    examples: [
      {
        input: "x = 121",
        output: "true",
        explanation: "121 reads as 121 from left to right and from right to left.",
      },
      {
        input: "x = -121",
        output: "false",
        explanation: "From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.",
      },
      {
        input: "x = 10",
        output: "false",
        explanation: "Reads 01 from right to left. Therefore it is not a palindrome.",
      },
    ],
    constraints: [
      "-2^31 <= x <= 2^31 - 1",
    ],
    hints: [
      "Negative numbers are not palindromes.",
      "Could you solve it without converting the integer to a string?",
      "Try reversing half of the number and compare.",
    ],
    starterCode: {
      javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindrome(x) {
    // Write your solution here
    
}`,
      python: `def is_palindrome(x: int) -> bool:
    """
    Check if the integer is a palindrome.
    
    Args:
        x: Integer to check
    
    Returns:
        True if palindrome, False otherwise
    """
    # Write your solution here
    pass`,
      typescript: `function isPalindrome(x: number): boolean {
    // Write your solution here
    
}`,
    },
    testCases: [
      {
        id: "tc1",
        input: JSON.stringify({ x: 121 }),
        expectedOutput: "true",
      },
      {
        id: "tc2",
        input: JSON.stringify({ x: -121 }),
        expectedOutput: "false",
      },
      {
        id: "tc3",
        input: JSON.stringify({ x: 10 }),
        expectedOutput: "false",
      },
      {
        id: "tc4",
        input: JSON.stringify({ x: 12321 }),
        expectedOutput: "true",
        isHidden: true,
      },
      {
        id: "tc5",
        input: JSON.stringify({ x: 0 }),
        expectedOutput: "true",
        isHidden: true,
      },
    ],
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ["Math"],
    estimatedMinutes: 10,
    acceptanceRate: 82,
  },

  // ============ MEDIUM PROBLEMS ============
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    category: "Strings",
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: "3",
        explanation: 'The answer is "wke", with the length of 3. Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.',
      },
    ],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    hints: [
      "Use a sliding window approach.",
      "Keep track of characters and their positions in the current window.",
      "When you encounter a repeating character, move the left pointer of the window.",
      "Use a Set or Map to track characters in the current window.",
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Write your solution here
    
}`,
      python: `def length_of_longest_substring(s: str) -> int:
    """
    Find the length of longest substring without repeating characters.
    
    Args:
        s: Input string
    
    Returns:
        Length of longest substring
    """
    # Write your solution here
    pass`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
    // Write your solution here
    
}`,
    },
    testCases: [
      {
        id: "tc1",
        input: JSON.stringify({ s: "abcabcbb" }),
        expectedOutput: "3",
      },
      {
        id: "tc2",
        input: JSON.stringify({ s: "bbbbb" }),
        expectedOutput: "1",
      },
      {
        id: "tc3",
        input: JSON.stringify({ s: "pwwkew" }),
        expectedOutput: "3",
      },
      {
        id: "tc4",
        input: JSON.stringify({ s: "" }),
        expectedOutput: "0",
        isHidden: true,
      },
      {
        id: "tc5",
        input: JSON.stringify({ s: "abcdefghijklmnop" }),
        expectedOutput: "16",
        isHidden: true,
      },
    ],
    solution: {
      javascript: `function lengthOfLongestSubstring(s) {
    const seen = new Map();
    let maxLen = 0;
    let left = 0;
    
    for (let right = 0; right < s.length; right++) {
        if (seen.has(s[right]) && seen.get(s[right]) >= left) {
            left = seen.get(s[right]) + 1;
        }
        seen.set(s[right], right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    
    return maxLen;
}`,
      python: `def length_of_longest_substring(s: str) -> int:
    seen = {}
    max_len = 0
    left = 0
    
    for right, char in enumerate(s):
        if char in seen and seen[char] >= left:
            left = seen[char] + 1
        seen[char] = right
        max_len = max(max_len, right - left + 1)
    
    return max_len`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
    const seen = new Map<string, number>();
    let maxLen = 0;
    let left = 0;
    
    for (let right = 0; right < s.length; right++) {
        if (seen.has(s[right]) && seen.get(s[right])! >= left) {
            left = seen.get(s[right])! + 1;
        }
        seen.set(s[right], right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    
    return maxLen;
}`,
    },
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ["Hash Table", "String", "Sliding Window"],
    estimatedMinutes: 25,
    acceptanceRate: 54,
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "medium",
    category: "Stack",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:

1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: "true",
      },
      {
        input: 's = "()[]{}"',
        output: "true",
      },
      {
        input: 's = "(]"',
        output: "false",
      },
      {
        input: 's = "([])"',
        output: "true",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'.",
    ],
    hints: [
      "Use a stack to keep track of opening brackets.",
      "When you encounter a closing bracket, check if the top of the stack matches.",
      "At the end, the stack should be empty for a valid string.",
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your solution here
    
}`,
      python: `def is_valid(s: str) -> bool:
    """
    Check if the parentheses string is valid.
    
    Args:
        s: String containing parentheses
    
    Returns:
        True if valid, False otherwise
    """
    # Write your solution here
    pass`,
      typescript: `function isValid(s: string): boolean {
    // Write your solution here
    
}`,
    },
    testCases: [
      {
        id: "tc1",
        input: JSON.stringify({ s: "()" }),
        expectedOutput: "true",
      },
      {
        id: "tc2",
        input: JSON.stringify({ s: "()[]{}" }),
        expectedOutput: "true",
      },
      {
        id: "tc3",
        input: JSON.stringify({ s: "(]" }),
        expectedOutput: "false",
      },
      {
        id: "tc4",
        input: JSON.stringify({ s: "([])" }),
        expectedOutput: "true",
      },
      {
        id: "tc5",
        input: JSON.stringify({ s: "([)]" }),
        expectedOutput: "false",
        isHidden: true,
      },
      {
        id: "tc6",
        input: JSON.stringify({ s: "{[]}" }),
        expectedOutput: "true",
        isHidden: true,
      },
    ],
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ["String", "Stack"],
    estimatedMinutes: 15,
    acceptanceRate: 68,
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "medium",
    category: "Arrays",
    description: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6].",
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation: "Intervals [1,4] and [4,5] are considered overlapping.",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= starti <= endi <= 10^4",
    ],
    hints: [
      "Sort the intervals by their start time first.",
      "Iterate through sorted intervals and merge overlapping ones.",
      "Two intervals overlap if the start of the second is less than or equal to the end of the first.",
    ],
    starterCode: {
      javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function merge(intervals) {
    // Write your solution here
    
}`,
      python: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    """
    Merge overlapping intervals.
    
    Args:
        intervals: List of intervals [start, end]
    
    Returns:
        List of merged intervals
    """
    # Write your solution here
    pass`,
      typescript: `function merge(intervals: number[][]): number[][] {
    // Write your solution here
    
}`,
    },
    testCases: [
      {
        id: "tc1",
        input: JSON.stringify({ intervals: [[1,3],[2,6],[8,10],[15,18]] }),
        expectedOutput: JSON.stringify([[1,6],[8,10],[15,18]]),
      },
      {
        id: "tc2",
        input: JSON.stringify({ intervals: [[1,4],[4,5]] }),
        expectedOutput: JSON.stringify([[1,5]]),
      },
      {
        id: "tc3",
        input: JSON.stringify({ intervals: [[1,4],[0,4]] }),
        expectedOutput: JSON.stringify([[0,4]]),
        isHidden: true,
      },
      {
        id: "tc4",
        input: JSON.stringify({ intervals: [[1,4],[2,3]] }),
        expectedOutput: JSON.stringify([[1,4]]),
        isHidden: true,
      },
    ],
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ["Array", "Sorting"],
    estimatedMinutes: 20,
    acceptanceRate: 58,
  },

  // ============ HARD PROBLEMS ============
  {
    id: "median-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "hard",
    category: "Binary Search",
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return **the median** of the two sorted arrays.

The overall run time complexity should be \`O(log (m+n))\`.`,
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
        explanation: "merged array = [1,2,3] and median is 2.",
      },
      {
        input: "nums1 = [1,2], nums2 = [3,4]",
        output: "2.50000",
        explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.",
      },
    ],
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6",
    ],
    hints: [
      "Think about the definition of median: it divides a sorted array into two equal halves.",
      "Use binary search on the smaller array to find the correct partition.",
      "Ensure elements on the left side of the partition are smaller than elements on the right.",
      "Handle edge cases where one partition is empty.",
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
function findMedianSortedArrays(nums1, nums2) {
    // Write your solution here
    
}`,
      python: `def find_median_sorted_arrays(nums1: list[int], nums2: list[int]) -> float:
    """
    Find the median of two sorted arrays.
    
    Args:
        nums1: First sorted array
        nums2: Second sorted array
    
    Returns:
        Median value
    """
    # Write your solution here
    pass`,
      typescript: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
    // Write your solution here
    
}`,
    },
    testCases: [
      {
        id: "tc1",
        input: JSON.stringify({ nums1: [1,3], nums2: [2] }),
        expectedOutput: "2",
      },
      {
        id: "tc2",
        input: JSON.stringify({ nums1: [1,2], nums2: [3,4] }),
        expectedOutput: "2.5",
      },
      {
        id: "tc3",
        input: JSON.stringify({ nums1: [], nums2: [1] }),
        expectedOutput: "1",
        isHidden: true,
      },
      {
        id: "tc4",
        input: JSON.stringify({ nums1: [2], nums2: [] }),
        expectedOutput: "2",
        isHidden: true,
      },
    ],
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    estimatedMinutes: 45,
    acceptanceRate: 35,
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "hard",
    category: "Arrays",
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.",
      },
      {
        input: "height = [4,2,0,3,2,5]",
        output: "9",
      },
    ],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
    hints: [
      "At each index, the amount of water trapped depends on the minimum of the maximum heights on both sides.",
      "For each position, water level = min(maxLeft, maxRight) - height[i]",
      "Can you precompute the maximum heights on the left and right for each index?",
      "Two-pointer approach can solve this in O(1) space.",
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
    // Write your solution here
    
}`,
      python: `def trap(height: list[int]) -> int:
    """
    Calculate trapped rain water.
    
    Args:
        height: Array representing elevation map
    
    Returns:
        Amount of water trapped
    """
    # Write your solution here
    pass`,
      typescript: `function trap(height: number[]): number {
    // Write your solution here
    
}`,
    },
    testCases: [
      {
        id: "tc1",
        input: JSON.stringify({ height: [0,1,0,2,1,0,1,3,2,1,2,1] }),
        expectedOutput: "6",
      },
      {
        id: "tc2",
        input: JSON.stringify({ height: [4,2,0,3,2,5] }),
        expectedOutput: "9",
      },
      {
        id: "tc3",
        input: JSON.stringify({ height: [1,2,3,4,5] }),
        expectedOutput: "0",
        isHidden: true,
      },
      {
        id: "tc4",
        input: JSON.stringify({ height: [5,4,3,2,1] }),
        expectedOutput: "0",
        isHidden: true,
      },
    ],
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
    estimatedMinutes: 35,
    acceptanceRate: 42,
  },
  {
    id: "regular-expression",
    title: "Regular Expression Matching",
    difficulty: "hard",
    category: "Dynamic Programming",
    description: `Given an input string \`s\` and a pattern \`p\`, implement regular expression matching with support for \`'.'\` and \`'*'\` where:

- \`'.'\` Matches any single character.
- \`'*'\` Matches zero or more of the preceding element.

The matching should cover the **entire** input string (not partial).`,
    examples: [
      {
        input: 's = "aa", p = "a"',
        output: "false",
        explanation: '"a" does not match the entire string "aa".',
      },
      {
        input: 's = "aa", p = "a*"',
        output: "true",
        explanation: '"*" means zero or more of the preceding element, \'a\'. Therefore, by repeating \'a\' once, it becomes "aa".',
      },
      {
        input: 's = "ab", p = ".*"',
        output: "true",
        explanation: '".*" means "zero or more (*) of any character (.)".',
      },
    ],
    constraints: [
      "1 <= s.length <= 20",
      "1 <= p.length <= 20",
      "s contains only lowercase English letters.",
      "p contains only lowercase English letters, '.', and '*'.",
      "It is guaranteed for each appearance of the character '*', there will be a previous valid character to match.",
    ],
    hints: [
      "Think of dynamic programming where dp[i][j] means s[0..i] matches p[0..j].",
      "Consider the cases: direct match, '.' wildcard, and '*' zero or more matches.",
      "For '*', you can either skip the pattern (zero occurrences) or use it (one or more).",
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @param {string} p
 * @return {boolean}
 */
function isMatch(s, p) {
    // Write your solution here
    
}`,
      python: `def is_match(s: str, p: str) -> bool:
    """
    Check if string matches the regex pattern.
    
    Args:
        s: Input string
        p: Pattern with '.' and '*'
    
    Returns:
        True if matches, False otherwise
    """
    # Write your solution here
    pass`,
      typescript: `function isMatch(s: string, p: string): boolean {
    // Write your solution here
    
}`,
    },
    testCases: [
      {
        id: "tc1",
        input: JSON.stringify({ s: "aa", p: "a" }),
        expectedOutput: "false",
      },
      {
        id: "tc2",
        input: JSON.stringify({ s: "aa", p: "a*" }),
        expectedOutput: "true",
      },
      {
        id: "tc3",
        input: JSON.stringify({ s: "ab", p: ".*" }),
        expectedOutput: "true",
      },
      {
        id: "tc4",
        input: JSON.stringify({ s: "aab", p: "c*a*b" }),
        expectedOutput: "true",
        isHidden: true,
      },
      {
        id: "tc5",
        input: JSON.stringify({ s: "mississippi", p: "mis*is*p*." }),
        expectedOutput: "false",
        isHidden: true,
      },
    ],
    timeLimit: 1000,
    memoryLimit: 128,
    tags: ["String", "Dynamic Programming", "Recursion"],
    estimatedMinutes: 45,
    acceptanceRate: 28,
  },
];

/**
 * Helper function to get problems by difficulty.
 */
export function getProblemsByDifficulty(difficulty: DifficultyLevel): CodingProblem[] {
  return codingProblems.filter((p) => p.difficulty === difficulty);
}

/**
 * Helper function to get a problem by ID.
 */
export function getProblemById(id: string): CodingProblem | undefined {
  return codingProblems.find((p) => p.id === id);
}

/**
 * Emotion-adaptive problem selection.
 * Returns a problem based on the student's emotional state.
 */
export function getAdaptiveProblem(
  currentDifficulty: DifficultyLevel,
  frustration: number,
  engagement: number,
  completedProblemIds: string[]
): CodingProblem | undefined {
  let targetDifficulty: DifficultyLevel = currentDifficulty;

  // High frustration -> easier problem
  if (frustration > 0.6) {
    if (currentDifficulty === "hard") targetDifficulty = "medium";
    else if (currentDifficulty === "medium") targetDifficulty = "easy";
  }
  // Low engagement + low frustration (bored) -> harder problem
  else if (engagement < 0.4 && frustration < 0.3) {
    if (currentDifficulty === "easy") targetDifficulty = "medium";
    else if (currentDifficulty === "medium") targetDifficulty = "hard";
  }

  // Get available problems at target difficulty
  const available = codingProblems.filter(
    (p) => p.difficulty === targetDifficulty && !completedProblemIds.includes(p.id)
  );

  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }

  // Fallback to any uncompleted problem
  const fallback = codingProblems.filter((p) => !completedProblemIds.includes(p.id));
  return fallback.length > 0 ? fallback[0] : undefined;
}
