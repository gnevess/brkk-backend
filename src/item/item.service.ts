import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateItemDto } from './dto/create-item.dto';
import { bucketUpload } from 'src/common/bucket/bucket-upload';
import { Readable } from 'stream';
import { getPresignedUrlForDownload } from 'src/common/bucket/presigned-urls';
import { PointsHistoryStatus, Status } from '@prisma/client';
import { WebSocketGateway } from 'src/websocket/websocket.gateway';
import { UsersService } from 'src/users/users.service';
import { UpdateItemDto } from './dto/update-item.dto';
import { bucketRemove } from 'src/common/bucket/bucket-delete';

@Injectable()
export class ItemService {
  constructor(
    private prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly wsGateway: WebSocketGateway,
  ) {}

  async createItem(data: CreateItemDto) {
    const { image, ...rest } = data;

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

    const item = await this.prisma.item.create({
      data: { ...rest, image: key },
    });

    this.wsGateway.sendItemUpdate(await this.getItems());

    return item;
  }

  async getItems() {
    const res = await this.prisma.item.findMany({
      where: {
        isHidden: false,
      },
      include: {
        transactions: true,
      },
    });

    return res.map(item => ({
      ...item,
      image: getPresignedUrlForDownload(item.image ?? ''),
    }));
  }

  async redeemItem(userId: string, itemId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: {
        transactions: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // check points
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // check if item is hidden
    if (item.isHidden) {
      throw new BadRequestException('Item is not available');
    }

    // check points
    if (user.points < item.price) {
      throw new BadRequestException('Insufficient points');
    }

    // Check cooldown
    const lastTransaction = await this.prisma.transaction.findFirst({
      where: {
        userId,
        itemId,
        createdAt: {
          // Check transactions within the cooldown period
          gte: new Date(Date.now() - item.cooldown * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (lastTransaction) {
      throw new BadRequestException(`Você deve esperar ${item.cooldown.toString()} horas entre os resgates deste item`);
    }

    // Check if item has reached its quantity limit
    if (item.transactions.length >= item.quantity) {
      throw new BadRequestException('Item is out of stock');
    }

    // Deduct points from user and create transaction in a transaction
    const [updatedUser, newTransaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { points: user.points - item.price },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          itemId,
          points: item.price,
          input: item.input,
          status: Status.Pending,
        },
      }),
    ]);

    await this.userService.createPointsHistory(
      userId,
      item.price,
      PointsHistoryStatus.Redeemed,
      'Resgate de item na loja',
      `Você resgatou o item ${item.name} da loja por ${item.price.toFixed(2)} pontos!`,
    );

    this.wsGateway.sendTransactionUpdate(newTransaction);

    return {
      item,
      remainingPoints: updatedUser.points,
    };
  }

  async deleteItem(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    await this.prisma.item.delete({
      where: { id },
    });

    this.wsGateway.sendItemUpdate(await this.getItems());

    return {
      message: 'Item deleted successfully',
    };
  }

  async updateItem(id: string, data: UpdateItemDto) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // check the image
    if (data.image) {
      const base64Data = data.image.split(',')[1];
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
      // bucket remove old image
      if (item.image) {
        await bucketRemove(item.image);
      }

      const { key } = await bucketUpload(multerFile);

      data.image = key;
    }

    const updatedItem = await this.prisma.item.update({
      where: { id },
      data,
    });

    this.wsGateway.sendItemUpdate(await this.getItems());

    return updatedItem;
  }
}
