'use client';

import { useEffect, useState } from 'react';

type Challenge = { prompt: string; choices: string[]; answer: number; explanation: string };

const challenges: Record<string, Challenge[]> = {
  'Stack & Queue Challenge': [
    { prompt: 'A stack contains A, then B is pushed. What does pop return?', choices: ['A', 'B', 'Both'], answer: 1, explanation: 'A stack is last in, first out, so the newest item B comes off first.' },
    { prompt: 'A queue receives A, then B. What does dequeue return?', choices: ['A', 'B', 'The newest item'], answer: 0, explanation: 'A queue is first in, first out, so A leaves before B.' },
    { prompt: 'Which structure is a natural fit for undo history?', choices: ['Stack', 'Queue', 'Neither'], answer: 0, explanation: 'Undo reverses the most recent action first, which matches a stack.' },
    { prompt: 'Which structure is a natural fit for customers waiting in line?', choices: ['Stack', 'Queue', 'Tree'], answer: 1, explanation: 'A queue serves the earliest arrival first.' },
  ],
  'Tree Explorer': [
    { prompt: 'In inorder traversal, visit left subtree, node, then right subtree. What is the first node for this tree: root 4, children 2 and 6, leaves 1, 3, 5, 7?', choices: ['1', '2', '4'], answer: 0, explanation: 'Inorder first goes all the way left, reaching node 1.' },
    { prompt: 'After node 1, which node comes next in inorder?', choices: ['3', '2', '4'], answer: 1, explanation: 'After the left leaf 1, visit its parent 2.' },
    { prompt: 'After finishing the left subtree, which node is visited?', choices: ['4', '5', '6'], answer: 0, explanation: 'The root 4 is visited between its left and right subtrees.' },
    { prompt: 'What is the complete inorder sequence?', choices: ['1, 2, 3, 4, 5, 6, 7', '4, 2, 1, 3, 6, 5, 7', '1, 3, 2, 5, 7, 6, 4'], answer: 0, explanation: 'Inorder traversal of a binary search tree visits values in sorted order.' },
  ],
  'Graph Navigator': [
    { prompt: 'Start BFS at A. A is connected to B and C. Which unvisited node is visited next?', choices: ['B', 'D', 'F'], answer: 0, explanation: 'BFS visits A’s neighbors before nodes farther away.' },
    { prompt: 'After B, which neighbor of A is next in the queue?', choices: ['C', 'E', 'A'], answer: 0, explanation: 'C was also queued from A, so it is visited next.' },
    { prompt: 'B connects to D, and C connects to E. Which is visited first?', choices: ['D', 'E', 'F'], answer: 0, explanation: 'D was queued while processing B, before E was queued from C.' },
    { prompt: 'Which structure does breadth-first search use to track frontier nodes?', choices: ['Queue', 'Stack', 'Sorted array'], answer: 0, explanation: 'A FIFO queue makes BFS visit nodes level by level.' },
  ],
  'Big-O Battle': [
    { prompt: 'Read every item in a list once. What is the time complexity?', choices: ['O(1)', 'O(log n)', 'O(n)'], answer: 2, explanation: 'The work grows proportionally with the number of list items.' },
    { prompt: 'Look up an item by index in an array.', choices: ['O(1)', 'O(n)', 'O(n²)'], answer: 0, explanation: 'Array indexing jumps directly to the requested position.' },
    { prompt: 'Binary search halves the remaining range each step.', choices: ['O(n)', 'O(log n)', 'O(n log n)'], answer: 1, explanation: 'Halving the range repeatedly takes logarithmically many steps.' },
    { prompt: 'Two nested loops each visit all n items.', choices: ['O(log n)', 'O(n)', 'O(n²)'], answer: 2, explanation: 'The inner n steps repeat for each of n outer steps.' },
    { prompt: 'A comparison sort such as merge sort.', choices: ['O(n log n)', 'O(n²)', 'O(1)'], answer: 0, explanation: 'Merge sort divides the input into log n levels and processes n items per level.' },
  ],
  'Recursion Dungeon': [
    { prompt: 'For factorial(4), which recursive call is made first?', choices: ['4 × factorial(3)', '4 + factorial(3)', 'factorial(5)'], answer: 0, explanation: 'Factorial n is n multiplied by factorial(n−1).' },
    { prompt: 'What is the base case for factorial?', choices: ['factorial(0) = 1', 'factorial(0) = 0', 'factorial(1) = 0'], answer: 0, explanation: 'The product of no factors is 1, so factorial(0) is 1.' },
    { prompt: 'When the calls return, what is factorial(3)?', choices: ['3', '6', '9'], answer: 1, explanation: '3 × 2 × 1 = 6.' },
    { prompt: 'What is factorial(4)?', choices: ['12', '16', '24'], answer: 2, explanation: '4 × factorial(3) = 4 × 6 = 24.' },
  ],
  'Dynamic Programming Lab': [
    { prompt: 'Fibonacci starts F(0)=0 and F(1)=1. What is F(2)?', choices: ['0', '1', '2'], answer: 1, explanation: 'F(2) = F(1) + F(0) = 1.' },
    { prompt: 'What is F(3)?', choices: ['2', '3', '4'], answer: 0, explanation: 'F(3) = F(2) + F(1) = 1 + 1 = 2.' },
    { prompt: 'What is F(5)?', choices: ['3', '5', '8'], answer: 1, explanation: 'The table is 0, 1, 1, 2, 3, 5.' },
    { prompt: 'Why save earlier Fibonacci values in a table?', choices: ['Avoid repeating work', 'Sort the sequence', 'Use less memory than a single value'], answer: 0, explanation: 'Memoization reuses computed subproblem results instead of recalculating them.' },
  ],
  'Logic Escape Room': [
    { prompt: 'Code: x = 2; x = x + 3; print(x). What prints?', choices: ['2', '3', '5'], answer: 2, explanation: 'The assignment changes x from 2 to 5.' },
    { prompt: 'A loop runs for i = 0, 1, 2. How many times does it run?', choices: ['2', '3', '4'], answer: 1, explanation: 'The values 0, 1, and 2 make three iterations.' },
    { prompt: 'If a condition is `n > 10`, does it run for n = 10?', choices: ['Yes', 'No'], answer: 1, explanation: '10 is not greater than 10; the condition is false.' },
    { prompt: 'An algorithm works for empty input but fails on one item. What should you inspect first?', choices: ['The single-item boundary case', 'The variable names', 'The color scheme'], answer: 0, explanation: 'Boundary cases often expose off-by-one errors.' },
  ],
  'Algorithm Boss Battles': [
    { prompt: 'Boss 1: Find 42 in a sorted array quickly. Which algorithm?', choices: ['Binary search', 'Linear scan only', 'Bubble sort'], answer: 0, explanation: 'Binary search repeatedly halves a sorted search range.' },
    { prompt: 'Boss 2: Process people in the order they arrived. Which structure?', choices: ['Queue', 'Stack', 'Heap'], answer: 0, explanation: 'A queue preserves arrival order with FIFO behavior.' },
    { prompt: 'Boss 3: You need the smallest value repeatedly. Which structure is useful?', choices: ['Min-heap', 'Stack', 'Unsorted queue'], answer: 0, explanation: 'A min-heap gives efficient access to the smallest item.' },
  ],
};

export function PlayableGameBoard({ game, onComplete }: { game: string; onComplete: () => void }) {
  const [question, setQuestion] = useState(0);
  const [message, setMessage] = useState('Choose an answer to begin.');
  const [complete, setComplete] = useState(false);
  const [sortValues, setSortValues] = useState([7, 3, 6, 2, 5]);
  const [sortedCount, setSortedCount] = useState(0);
  const [sortMoves, setSortMoves] = useState(0);

  useEffect(() => {
    setQuestion(0);
    setMessage('Choose an answer to begin.');
    setComplete(false);
    setSortValues([7, 3, 6, 2, 5]);
    setSortedCount(0);
    setSortMoves(0);
  }, [game]);

  function answer(choiceIndex: number) {
    const rounds = challenges[game];
    const current = rounds?.[question];
    if (!current || complete) return;
    if (choiceIndex !== current.answer) {
      setMessage(`Not quite. ${current.explanation}`);
      return;
    }
    if (question + 1 === rounds.length) {
      setComplete(true);
      setMessage('Challenge cleared! +50 XP');
      onComplete();
    } else {
      setQuestion(value => value + 1);
      setMessage(`Correct! ${current.explanation}`);
    }
  }

  function chooseSortItem(index: number) {
    if (complete || index < sortedCount) return;
    setSortMoves(value => value + 1);
    const minimum = Math.min(...sortValues.slice(sortedCount));
    if (sortValues[index] !== minimum) {
      setMessage(`${sortValues[index]} is not the smallest remaining value. Find the minimum in the unsorted part.`);
      return;
    }
    const next = [...sortValues];
    [next[sortedCount], next[index]] = [next[index], next[sortedCount]];
    setSortValues(next);
    if (sortedCount + 1 === next.length - 1) {
      setComplete(true);
      setSortedCount(next.length);
      setMessage('Array sorted! You completed selection sort. +50 XP');
      onComplete();
    } else {
      setSortedCount(value => value + 1);
      setMessage(`Correct. ${minimum} is the smallest remaining value; it is now in the sorted section.`);
    }
  }

  if (game === 'Sorting Arena') {
    return <div className="panel"><p className="muted">Selection sort: choose the smallest value from the unsorted section. It will swap into the next sorted position.</p><div className="gameboard">{sortValues.map((value, index) => <button key={`${index}-${value}`} className={`numbertile ${index < sortedCount ? 'selected' : ''}`} disabled={complete || index < sortedCount} onClick={() => chooseSortItem(index)}>{value}<div style={{fontSize:11,color:'var(--muted)'}}>{index < sortedCount ? 'sorted' : 'choose'}</div></button>)}</div><div className="statrow"><div className="stat"><span className="muted">Sorted</span><strong>{Math.min(sortedCount, sortValues.length)}/{sortValues.length}</strong></div><div className="stat"><span className="muted">Selections</span><strong>{sortMoves}</strong></div><div className="stat"><span className="muted">Algorithm</span><strong>O(n²)</strong></div></div><div className="notice">{message}</div><div className="actions"><button className="secondary" onClick={() => {setSortValues([7,3,6,2,5]);setSortedCount(0);setSortMoves(0);setComplete(false);setMessage('Choose the smallest value in the unsorted section.')}}>Restart</button></div></div>;
  }

  const rounds = challenges[game] || [];
  const current = rounds[question];
  return <div className="panel"><p className="muted">{game === 'Tree Explorer' ? 'Tree: root 4; children 2 and 6; leaves 1, 3, 5, and 7.' : game === 'Graph Navigator' ? 'Graph: A connects to B and C; B connects to D; C connects to E.' : 'Solve each step to clear the challenge.'}</p>{current ? <><span className="tag">ROUND {question + 1} / {rounds.length}</span><h2 className="challenge-prompt">{current.prompt}</h2><div className="choice-grid">{current.choices.map((choice, index) => <button className="secondary choice-button" key={choice} disabled={complete} onClick={() => answer(index)}>{choice}</button>)}</div></> : <p>This game is not configured yet.</p>}<div className="notice" role="status">{message}</div><div className="actions"><button className="secondary" onClick={() => {setQuestion(0);setComplete(false);setMessage('Choose an answer to begin.')}}>Restart</button></div></div>;
}
