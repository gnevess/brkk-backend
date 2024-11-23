import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated.request.interface';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(req.user.id, createPostDto);
  }

  @Get('feed')
  getFeed(@Req() req: AuthenticatedRequest) {
    return this.postsService.getFeed(req.user.id);
  }

  @Post(':id/like')
  likePost(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.postsService.likePost(req.user.id, id);
  }

  @Get('trending/topics')
  getTrendingTopics() {
    return this.postsService.getTrendingTopics();
  }
}
