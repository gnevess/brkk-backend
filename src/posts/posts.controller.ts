import { Controller, Get, Post, Body, UseGuards, Req, Param, Query, DefaultValuePipe, ParseIntPipe, Delete } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated.request.interface';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(req.user.id, createPostDto);
  }

  @Get(':id')
  getPost(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.postsService.getPost(req.user.id, id);
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

  @Post(':id/comments')
  createComment(
    @Req() req: AuthenticatedRequest,
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.postsService.createComment(req.user.id, postId, createCommentDto);
  }

  @Get(':id/comments')
  getComments(
    @Param('id') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postsService.getComments(postId, page, limit);
  }

  @Delete('comments/:id')
  deleteComment(@Req() req: AuthenticatedRequest, @Param('id') commentId: string) {
    return this.postsService.deleteComment(req.user.id, commentId);
  }
}
