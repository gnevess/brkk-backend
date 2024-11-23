import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreatePostDto } from './dto/create-post.dto';
import { Readable } from 'stream';
import { bucketUpload } from 'src/common/bucket/bucket-upload';
import { getPresignedUrlForDownload } from 'src/common/bucket/presigned-urls';
import { WebSocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebSocketGateway,
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    // Add rate limiting check
    const lastPost = await this.prisma.post.findFirst({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (lastPost) {
      throw new HttpException('Por favor, espere 5 minutos entre posts', HttpStatus.TOO_MANY_REQUESTS);
    }

    const { image, ...rest } = createPostDto;
    let imageKey: string | null = null;
    if (image) {
      // Convert base64 to Multer File object
      const base64Data = image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const multerFile: Express.Multer.File = {
        buffer,
        fieldname: 'file',
        originalname: `image-${Date.now().toString()}.png`,
        encoding: '7bit',
        mimetype: 'image/png',
        size: buffer.length,
        stream: Readable.from(buffer),
        destination: '',
        filename: '',
        path: '',
      };

      const { key } = await bucketUpload(multerFile);
      imageKey = key;
    }

    await this.processPostContent(rest.content);

    const post = await this.prisma.post.create({
      data: {
        userId,
        content: createPostDto.content,
        image: imageKey,
        clip: createPostDto.clip
          ? {
              create: {
                thumbnail: createPostDto.clip.thumbnail,
                url: createPostDto.clip.url,
              },
            }
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            UserProfile: {
              select: {
                displayName: true,
                login: true,
                avatar: true,
              },
            },
          },
        },
        clip: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    this.websocketGateway.sendPostUpdate(post);

    return post;
  }

  async getFeed(userId: string) {
    // Fetch posts first
    const posts = await this.prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            UserProfile: {
              select: {
                displayName: true,
                login: true,
                avatar: true,
              },
            },
          },
        },
        clip: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
        likes: {
          where: {
            userId,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate presigned URLs in parallel using Promise.all
    const processedPosts = await Promise.all(
      posts.map(post => ({
        ...post,
        image: post.image ? getPresignedUrlForDownload(post.image) : null,
        isLiked: post.likes.length > 0,
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
      })),
    );

    return processedPosts;
  }

  async likePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked the post
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      throw new HttpException('Você já curtiu este post', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    return { message: 'Post curtido com sucesso' };
  }

  async unlikePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return { message: 'Post descurtido com sucesso' };
  }

  async updateTopicCount(topicName: string) {
    const topic = await this.prisma.topic.upsert({
      where: { name: topicName },
      update: {
        postCount: {
          increment: 1,
        },
      },
      create: {
        name: topicName,
        postCount: 1,
      },
    });

    this.websocketGateway.sendTrendingUpdate(topic);
    return topic;
  }

  async getTrendingTopics() {
    const topics = await this.prisma.topic.findMany({
      orderBy: {
        postCount: 'desc',
      },
      take: 10,
    });

    return topics;
  }

  private extractTopics(content: string): string[] {
    const hashtagRegex = /#[\w\u0080-\uFFFF]+/g;
    return (content.match(hashtagRegex) ?? []).map(tag => tag.slice(1).toLowerCase());
  }

  async processPostContent(content: string) {
    const topics = this.extractTopics(content);
    await Promise.all(topics.map(topic => this.updateTopicCount(topic)));
    return topics;
  }
}
