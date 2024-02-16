import { Component, OnInit } from '@angular/core';
import { LikeService } from '../../services/like/like.service';

@Component({
  selector: 'app-like',
  templateUrl: './like.component.html',
  styleUrl: './like.component.css'
})
export class LikeComponent implements OnInit {
    className: string = 'border border-gray-500 flex justify-center items-center py-2 px-2 rounded-lg cursor-pointer hover:bg-opacity2';
    state!: boolean;

    likes!: number;

    constructor (private likeService: LikeService) {}

    ngOnInit(): void {
        this.state = this.likeService.hasLiked();

        if(this.state) {
            this.className = 'absolute top-5 right-5 flex justify-center items-center py-2 px-2 bg-[#EC185D] cursor-pointer rounded-lg';
        }
    }

    addLikes = async () => {
        if(this.likeService.hasLiked()) {
            alert("You already liked. Thanks for it btw😁");
            return;
        }
        
        // await addNewLike();

        this.likeService.setLiked();
        this.state = this.likeService.hasLiked();
        this.className = 'border-2 border-gray-500 flex justify-center items-center py-2 px-2 bg-opacity3 cursor-pointer rounded-lg'; // bg-[#EC185D]
        setTimeout(() => (
            alert("Thanks! I hope you enjoyed 😃")
        ), 300);
    }
}
