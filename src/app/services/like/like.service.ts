import { Injectable } from '@angular/core';

const LIKE_KEY = 'appLiked';

@Injectable({
  providedIn: 'root'
})
export class LikeService {

  constructor() { }
  
  hasLiked(): boolean {
    return localStorage.getItem(LIKE_KEY) === 'true';
  }

  setLiked(): void {
    localStorage.setItem(LIKE_KEY, 'true');
  }
}
