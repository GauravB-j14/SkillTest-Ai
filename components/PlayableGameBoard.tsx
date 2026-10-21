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
  'Linked List Lab': [
    { prompt: 'A → B → C. Which node does A.next point to?', choices: ['A', 'B', 'C'], answer: 1, explanation: 'Each node points to the next node; A.next is B.' },
    { prompt: 'To insert X between A and B, which pointer should be set first?', choices: ['X.next = B', 'A.next = B', 'B.next = X'], answer: 0, explanation: 'Point X to B before changing A.next, so the rest of the chain stays connected.' },
    { prompt: 'What is the time complexity to access the 8th node from the head?', choices: ['O(1)', 'O(log n)', 'O(n)'], answer: 2, explanation: 'A linked list must follow next pointers node by node.' },
    { prompt: 'In a singly linked list, what marks the end?', choices: ['A null next pointer', 'A pointer to the head', 'An empty value'], answer: 0, explanation: 'The final node points to null.' },
  ],
  'Hash Map Heist': [
    { prompt: 'A map stores student names and grades. What is the name used to retrieve a grade?', choices: ['Key', 'Bucket count', 'Pointer'], answer: 0, explanation: 'The key identifies the value stored in the map.' },
    { prompt: 'Two different keys map to the same bucket. What happened?', choices: ['A collision', 'A traversal', 'A cache miss'], answer: 0, explanation: 'A hash collision occurs when keys produce the same bucket index.' },
    { prompt: 'With a good hash function, what is the average lookup time?', choices: ['O(1)', 'O(log n)', 'O(n²)'], answer: 0, explanation: 'Hash maps provide average constant-time lookup.' },
    { prompt: 'What should a map do when two keys collide?', choices: ['Store both using collision handling', 'Discard one key', 'Sort the keys'], answer: 0, explanation: 'Chaining or probing lets a map keep both entries.' },
  ],
  'Heap Keeper': [
    { prompt: 'In a min-heap, which value is at the root?', choices: ['The smallest', 'The largest', 'The most recently added'], answer: 0, explanation: 'Every parent in a min-heap is no greater than its children.' },
    { prompt: 'A min-heap root is 2 with children 5 and 4. Is heap order valid?', choices: ['Yes', 'No, children must be smaller', 'No, root must be largest'], answer: 0, explanation: 'The root 2 is smaller than both children.' },
    { prompt: 'After removing the root, what restores heap order?', choices: ['Move the last item to root, then sift down', 'Reverse the array', 'Run binary search'], answer: 0, explanation: 'Sifting down restores the parent-child ordering.' },
    { prompt: 'What is the time to remove the minimum from a binary heap?', choices: ['O(1)', 'O(log n)', 'O(n)'], answer: 1, explanation: 'The root is found immediately, then heap order is restored down one tree path.' },
  ],
  'Two-Pointer Trek': [
    { prompt: 'In a sorted array, to find two values summing to 10, where do pointers usually start?', choices: ['At both ends', 'Both at index 0', 'At random positions'], answer: 0, explanation: 'Starting at both ends lets you increase or decrease the sum efficiently.' },
    { prompt: 'Values are 2 and 9; target is 10. What should the left pointer do?', choices: ['Move right to increase the sum', 'Move left', 'Stop immediately'], answer: 0, explanation: 'The sum is too small, so advance the left pointer to a larger value.' },
    { prompt: 'Values are 4 and 9; target is 10. What should the right pointer do?', choices: ['Move left to decrease the sum', 'Move right', 'Reset both pointers'], answer: 0, explanation: 'The sum is too large, so move the right pointer to a smaller value.' },
    { prompt: 'What is the time complexity of this scan?', choices: ['O(n)', 'O(n²)', 'O(log n)'], answer: 0, explanation: 'Each pointer moves across the array at most once.' },
  ],
  'Sliding Window Sprint': [
    { prompt: 'For a fixed-size window of 3, which indices form the first window?', choices: ['0, 1, 2', '0, 1, 2, 3', '1, 2, 3'], answer: 0, explanation: 'A size-3 window starting at index 0 contains indices 0 through 2.' },
    { prompt: 'When the window moves right by one, what leaves it?', choices: ['The leftmost value', 'The rightmost value', 'The middle value'], answer: 0, explanation: 'The left edge advances, so its old value leaves the window.' },
    { prompt: 'How can you update a running sum efficiently?', choices: ['Subtract the outgoing value and add the incoming value', 'Re-sum the whole array', 'Divide the sum by the window size'], answer: 0, explanation: 'Only two values change when a fixed-size window shifts.' },
    { prompt: 'What is the time complexity to check all fixed-size windows this way?', choices: ['O(n)', 'O(n²)', 'O(1)'], answer: 0, explanation: 'Each array element enters and leaves the window at most once.' },
  ],
  'Greedy Route Planner': [
    { prompt: 'A greedy algorithm chooses:', choices: ['The best-looking local choice now', 'Every possible path', 'A random choice each time'], answer: 0, explanation: 'Greedy methods make a locally optimal choice at each step.' },
    { prompt: 'For activity selection, which activity is often chosen first?', choices: ['The one that finishes earliest', 'The one that starts latest', 'The longest activity'], answer: 0, explanation: 'Finishing earliest leaves the most room for later activities.' },
    { prompt: 'Does a greedy choice always produce the global optimum for every problem?', choices: ['No', 'Yes', 'Only when input is sorted'], answer: 0, explanation: 'Greedy correctness depends on the problem having the right structure.' },
    { prompt: 'Which task is a classic greedy example?', choices: ['Selecting non-overlapping activities by finish time', 'Enumerating all permutations', 'Computing every subarray sum from scratch'], answer: 0, explanation: 'Earliest-finish activity selection has a greedy optimal strategy.' },
  ],
  'Union-Find Frontier': [
    { prompt: 'What does find(x) tell you in disjoint-set union?', choices: ['The representative of x’s component', 'The shortest path to x', 'The number of graph edges'], answer: 0, explanation: 'Find returns the root representative for the component containing x.' },
    { prompt: 'What does union(a, b) do?', choices: ['Combines the components containing a and b', 'Sorts a and b', 'Removes both nodes'], answer: 0, explanation: 'Union merges two sets into one connected component.' },
    { prompt: 'If find(a) equals find(b), what do you know?', choices: ['They are already connected', 'They have equal values', 'They have no path between them'], answer: 0, explanation: 'Nodes with the same representative belong to the same component.' },
    { prompt: 'Which optimization flattens paths during find?', choices: ['Path compression', 'Heapify', 'Memo sorting'], answer: 0, explanation: 'Path compression points visited nodes closer to the representative.' },
  ],
  'Trie Word Hunt': [
    { prompt: 'What do nodes along a trie path represent?', choices: ['Characters in a prefix', 'Sorted numeric values', 'Graph edge weights'], answer: 0, explanation: 'Each step follows a character, so a path spells a prefix.' },
    { prompt: 'Words are “car” and “cat”. What prefix do they share?', choices: ['ca', 'car', 'cat'], answer: 0, explanation: 'Both words begin with c followed by a.' },
    { prompt: 'How does a trie help test whether a prefix exists?', choices: ['Follow its characters from the root', 'Scan every stored word fully', 'Sort all words again'], answer: 0, explanation: 'A prefix lookup follows one edge per character.' },
    { prompt: 'What extra marker commonly distinguishes a complete word from just a prefix?', choices: ['End-of-word flag', 'Heap root', 'Null key'], answer: 0, explanation: 'An end-of-word marker records that a stored word finishes at that node.' },
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
