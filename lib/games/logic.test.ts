import {describe,it,expect} from 'vitest';
import {calculateTypingStats,binarySearchStep,isSorted,sortSwap} from './logic';
describe('typing stats',()=>{it('calculates correctness and accuracy',()=>{expect(calculateTypingStats('hello','heX',60)).toMatchObject({correct:2,incorrect:1,accuracy:67,wpm:0,completion:60});});it('handles empty input',()=>{expect(calculateTypingStats('abc','',10).accuracy).toBe(100);});});
describe('game logic',()=>{it('finds the midpoint',()=>{expect(binarySearchStep([1,3,5,7,9],7,0,4).value).toBe(5);});it('validates sorted arrays',()=>{expect(isSorted([1,2,2])).toBe(true);expect(isSorted([2,1])).toBe(false);});it('swaps without mutating original',()=>{const a=[3,1];expect(sortSwap(a,0,1)).toEqual([1,3]);expect(a).toEqual([3,1]);});});
