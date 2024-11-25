import { Controller, Get, Post, Body, UseGuards, Req, Param, Query } from '@nestjs/common';
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

  @Get('feed/newer')
  getNewerPosts(
    @Req() req: AuthenticatedRequest,
    @Param('lastId') lastId?: string,
    @Param('limit') limit = '10',
  ) {
    console.log(`lastId:`, lastId);
    console.log(`limit:`, limit);
    return this.postsService.getNewerPosts(req.user.id, lastId, parseInt(limit));
  }

  @Get('feed/older')
  getOlderPosts(
    @Req() req: AuthenticatedRequest,
    @Query('oldestPostId') oldestPostId?: string,
    @Query('limit') limit = '10',
    @Query('topic') topic?: string,
  ) {
    return this.postsService.getOlderPosts(
      req.user.id,
      oldestPostId,
      parseInt(limit),
      topic
    );
  }

  @Get('feed')
  getFeed(@Req() req: AuthenticatedRequest) {
    return this.postsService.getFeed(req.user.id);
  }

  @Post(':id/like')
  likePost(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.postsService.likePost(req.user.id, id);
  }

  @Post(':id/unlike')
  unlikePost(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.postsService.unlikePost(req.user.id, id);
  }

  @Get('trending/topics')
  getTrendingTopics() {
    return this.postsService.getTrendingTopics();
  }
}
