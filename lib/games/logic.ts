export type TypingStats = {wpm:number;accuracy:number;cpm:number;correct:number;incorrect:number;elapsed:number;completion:number};
export function calculateTypingStats(target:string, typed:string, elapsedSeconds:number):TypingStats {
  const correct = [...typed].reduce((n,ch,i)=>n+(ch===target[i]?1:0),0);
  const incorrect = typed.length-correct;
  const minutes = Math.max(elapsedSeconds,1)/60;
  return {wpm:Math.round((correct/5)/minutes),accuracy:typed.length?Math.round(correct/typed.length*100):100,cpm:Math.round(correct/minutes),correct,incorrect,elapsed:Math.max(0,Math.floor(elapsedSeconds)),completion:target.length?Math.min(100,Math.round(typed.length/target.length*100)):0};
}
export function binarySearchStep(arr:number[], target:number, low:number, high:number) { if(low>high)return {found:false,low,high,mid:-1}; const mid=Math.floor((low+high)/2); return {found:arr[mid]===target,low,high,mid,value:arr[mid]}; }
export function isSorted(arr:number[]) { return arr.every((v,i)=>i===0||arr[i-1]<=v); }
export function sortSwap(arr:number[],i:number,j:number) { if(i<0||j<0||i>=arr.length||j>=arr.length) throw new Error('Swap index out of range'); const copy=[...arr]; [copy[i],copy[j]]=[copy[j],copy[i]]; return copy; }
