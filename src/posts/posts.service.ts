import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreatePostDto } from './dto/create-post.dto';
import { Readable } from 'stream';
import { bucketUpload } from 'src/common/bucket/bucket-upload';
import { getPresignedUrlForDownload } from 'src/common/bucket/presigned-urls';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
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
        user: true,
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

    return post;
  }

  async getFeed(userId: string) {
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

    return posts.map(post => ({
      ...post,
      image: post.image ? getPresignedUrlForDownload(post.image) : null,
      isLiked: post.likes.length > 0,
      likes: post._count.likes,
      comments: post._count.comments,
      shares: post._count.shares,
    }));
  }

  async likePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    return { message: 'Post liked successfully' };
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
