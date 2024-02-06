import { Component, OnInit } from '@angular/core';
import { LikeService } from '../../services/like/like.service';

@Component({
  selector: 'app-like',
  templateUrl: './like.component.html',
  styleUrl: './like.component.css'
})
export class LikeComponent implements OnInit {
    className: string = 'border border-gray-100 absolute top-5 right-5 flex justify-center items-center py-2 px-2 rounded-lg cursor-pointer hover:bg-opacity3';
    state!: boolean; 

    constructor (private likeService: LikeService) {}

    ngOnInit(): void {
        this.state = this.likeService.hasLiked();

        if(this.state) {
            this.className = 'absolute top-5 right-5 flex justify-center items-center py-2 px-2 bg-[#EC185D] cursor-pointer rounded-lg';
        }
    }

    addLikes() {
        if(this.likeService.hasLiked()) {
            alert("You already liked. Thanks for it btw😁");
            return;
        }
        this.likeService.setLiked();
        this.state = this.likeService.hasLiked();
        this.className = 'absolute top-5 right-5 flex justify-center items-center py-2 px-2 bg-[#EC185D] cursor-pointer rounded-lg';
        setTimeout(() => (
            alert("Thanks! I hope you enjoyed 😃")
        ), 300);
    }
}
