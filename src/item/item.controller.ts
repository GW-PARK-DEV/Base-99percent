import { Controller, Get, UseGuards, Request, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { ItemService } from './item.service';
import { UserService } from '../user/user.service';
import { ItemResponseDto } from './dto/item.dto';

@ApiTags('items')
@Controller('items')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly userService: UserService,
  ) {}

  @Get()
  @ApiOperation({ summary: '판매 중인 아이템 목록 조회' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  async getItems(): Promise<ItemResponseDto[]> {
    return this.itemService.findAllActiveWithDetails();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 판매 중인 아이템 목록 조회' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  @ApiResponse({ status: 401 })
  async getMyItems(@Request() req: any): Promise<ItemResponseDto[]> {
    return this.itemService.findByUserIdWithDetails(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '아이템 ID로 조회' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  @ApiResponse({ status: 404 })
  async getItemById(@Param('id', ParseIntPipe) id: number): Promise<ItemResponseDto> {
    return this.itemService.findByIdWithDetails(id);
  }
}