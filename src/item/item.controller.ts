import { Controller, Get, Post, Body, UseGuards, Param, Req, Delete, Put } from '@nestjs/common';
import { ItemService } from './item.service';
import { ApiResponse } from '@nestjs/swagger';
import { CreateItemDto } from './dto/create-item.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated.request.interface';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @ApiResponse({
    status: 200,
    description: 'Create an item',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createItem(@Body() body: CreateItemDto) {
    return await this.itemService.createItem(body);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all items',
  })
  async getItems() {
    return await this.itemService.getItems();
  }

  @Post('redeem/:id')
  @UseGuards(JwtAuthGuard)
  async redeemItem(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return await this.itemService.redeemItem(req.user.id, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteItem(@Param('id') id: string) {
    return await this.itemService.deleteItem(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateItem(@Param('id') id: string, @Body() body: UpdateItemDto) {
    return await this.itemService.updateItem(id, body);
  }
}
