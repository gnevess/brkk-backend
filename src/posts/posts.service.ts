import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreatePostDto } from './dto/create-post.dto';
import { Readable } from 'stream';
import { bucketUpload } from 'src/common/bucket/bucket-upload';
import { getPresignedUrlForDownload } from 'src/common/bucket/presigned-urls';
import { WebSocketGateway } from 'src/websocket/websocket.gateway';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ForbiddenError } from 'src/common/exceptions';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebSocketGateway,
  ) {}

  async getPost(userId: string, id: string) {
    const posts = await this.prisma.post.findUnique({
      where: { id },
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
            TwitchUserBadges: true,
            badges: true,
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
    });

    if (!posts) {
      throw new NotFoundException('Post not found');
    }

    const processedPosts = {
      ...posts,
      image: posts.image ? getPresignedUrlForDownload(posts.image) : null,
      isLiked: posts.likes.length > 0,
      likes: posts._count.likes,
      comments: posts._count.comments,
      shares: posts._count.shares,
    };

    return processedPosts;
  }

  async getNewerPosts(userId: string, lastId?: string, limit = 10) {
    const posts = await this.prisma.post.findMany({
      where: {
        ...(lastId
          ? {
              id: {
                gt: lastId,
              },
            }
          : {}),
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
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
            TwitchUserBadges: true,
            badges: true,
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
    });

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

  async getOlderPosts(userId: string, oldestPostId?: string, limit = 10, topic?: string) {
    // If oldestPostId is provided, get the reference post's createdAt
    const referenceDate = oldestPostId
      ? (
          await this.prisma.post.findUnique({
            where: { id: oldestPostId },
            select: { createdAt: true },
          })
        )?.createdAt
      : undefined;

    const posts = await this.prisma.post.findMany({
      where: {
        ...(referenceDate
          ? {
              createdAt: {
                lt: referenceDate,
              },
            }
          : {}),
        ...(topic
          ? {
              content: {
                contains: `#${topic}`,
              },
            }
          : {}),
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
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
            TwitchUserBadges: true,
            badges: true,
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
    });

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
            TwitchUserBadges: true,
            badges: true,
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
        likes: true,
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
            TwitchUserBadges: true,
            badges: true,
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

    console.log(`likePost: ${postId} ${userId}`);

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

    this.websocketGateway.sendLikeUpdate('add', userId, postId);

    return { message: 'Post curtido com sucesso' };
  }

  async unlikePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    console.log(`unlikePost: ${postId} ${userId}`);
    // Check if the like exists before attempting to delete
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (!existingLike) {
      throw new HttpException('Você ainda não curtiu este post', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    this.websocketGateway.sendLikeUpdate('remove', userId, postId);

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

  async createComment(userId: string, postId: string, createCommentDto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        userId,
        postId,
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
            TwitchUserBadges: true,
            badges: true,
          },
        },
      },
    });

    this.websocketGateway.sendCommentUpdate('add', comment);

    return comment;
  }

  async getComments(postId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
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
              TwitchUserBadges: true,
              badges: true,
            },
          },
          likes: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: { postId },
      }),
    ]);

    return {
      comments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    this.websocketGateway.sendCommentUpdate('remove', comment);

    return { message: 'Comment deleted successfully' };
  }
}
