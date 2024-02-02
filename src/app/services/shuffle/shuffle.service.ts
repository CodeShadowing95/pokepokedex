import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShuffleService {

  constructor() { }

  /**
   * The algorithm works by iterating through the array from the last element 
   * to the first, and at each iteration, it swaps the current element with 
   * a randomly selected element before it. This process is repeated for each element 
   * in the array, ensuring that every element has an equal chance of ending up 
   * at any position in the shuffled array.
   */
  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
