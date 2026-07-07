import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  async getCart(userId: string, storeId?: string) {
    if (storeId) {
      const cart = await this.findCart(userId, storeId);
      return {
        success: true,
        data: cart ? this.format(cart) : this.emptyCart(storeId),
      };
    }

    const carts = await this.cartRepo.find({
      where: { userId },
      relations: ['items'],
      order: { updatedAt: 'DESC' },
    });

    return {
      success: true,
      data: {
        carts: carts.map((cart) => this.format(cart)),
        cart_count: carts.length,
      },
    };
  }

  async addItem(userId: string, dto: AddItemDto) {
    const product = await this.productsService.findByCode(
      dto.store_id,
      dto.product_code,
    );
    if (!product)
      throw new NotFoundException('Product not found in this store');

    let cart = await this.findCart(userId, dto.store_id);

    if (!cart) {
      cart = await this.cartRepo.save(
        this.cartRepo.create({ userId, storeId: dto.store_id, items: [] }),
      );
    }

    const existing = cart.items.find(
      (item) => item.productCode === dto.product_code,
    );
    const requestedQuantity = existing ? existing.quantity + 1 : 1;
    this.productsService.assertAvailable(
      product,
      product.productName,
      requestedQuantity,
    );

    if (existing) {
      existing.quantity = requestedQuantity;
      await this.itemRepo.save(existing);
    } else {
      await this.itemRepo.save(
        this.itemRepo.create({
          cart,
          productCode: product.productCode,
          productName: product.productName,
          productPrice: parseFloat(product.productPrice) || 0,
          productDiscountPrice: parseFloat(product.productDiscountPrice) || 0,
          quantity: 1,
        }),
      );
    }

    return {
      success: true,
      data: this.format(await this.getCartOrThrow(userId, dto.store_id)),
    };
  }

  async updateItem(
    userId: string,
    productCode: string,
    dto: UpdateItemDto,
    storeId: string,
  ) {
    const cart = await this.getCartOrThrow(userId, storeId);
    const item = this.getItemOrThrow(cart, productCode);

    if (dto.quantity === 0) {
      await this.itemRepo.remove(item);
    } else {
      const product = await this.productsService.findByCode(
        cart.storeId,
        productCode,
      );
      this.productsService.assertAvailable(
        product,
        item.productName,
        dto.quantity,
      );

      item.quantity = dto.quantity;
      await this.itemRepo.save(item);
    }

    return {
      success: true,
      data: this.format(await this.getCartOrThrow(userId, cart.storeId)),
    };
  }

  async removeItem(userId: string, productCode: string, storeId: string) {
    const cart = await this.getCartOrThrow(userId, storeId);
    const item = this.getItemOrThrow(cart, productCode);

    await this.itemRepo.remove(item);

    return {
      success: true,
      data: this.format(await this.getCartOrThrow(userId, cart.storeId)),
    };
  }

  async clearCart(userId: string, storeId: string) {
    await this.clearByUserAndStoreId(userId, storeId);
    return { success: true, message: 'Cart cleared' };
  }

  async validateCart(userId: string, storeId: string) {
    const cart = await this.findCart(userId, storeId);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const issues: string[] = [];
    const itemResults: any[] = [];

    for (const cartItem of cart.items) {
      const product = await this.productsService.findByCode(
        cart.storeId,
        cartItem.productCode,
      );

      const itemResult: any = {
        product_code: cartItem.productCode,
        product_name: cartItem.productName,
        quantity: cartItem.quantity,
        cart_price:
          Number(cartItem.productDiscountPrice) ||
          Number(cartItem.productPrice),
        issues: [],
      };

      const availabilityIssues = this.productsService.checkAvailability(
        product,
        cartItem.quantity,
      );
      itemResult.issues.push(...availabilityIssues);
      itemResult.available =
        product?.status === 'Enable' &&
        this.productsService.parseStock(product) > 0;

      if (product && itemResult.available) {
        const stock = this.productsService.parseStock(product);
        if (cartItem.quantity > stock) itemResult.max_quantity = stock;

        const currentPrice = this.productsService.getEffectivePrice(product);
        const cartPrice =
          Number(cartItem.productDiscountPrice) ||
          Number(cartItem.productPrice);

        if (Math.abs(currentPrice - cartPrice) > 0.01) {
          itemResult.issues.push(
            `Price changed from Rs.${cartPrice} to Rs.${currentPrice}`,
          );
          itemResult.current_price = currentPrice;
        }
      }

      itemResults.push(itemResult);
      if (itemResult.issues.length > 0) {
        issues.push(
          ...itemResult.issues.map(
            (issue: string) => `${cartItem.productName}: ${issue}`,
          ),
        );
      }
    }

    return {
      success: true,
      data: {
        store_id: cart.storeId,
        valid: issues.length === 0,
        issues,
        items: itemResults,
      },
    };
  }

  async clearByUserId(userId: string): Promise<void> {
    const carts = await this.cartRepo.find({
      where: { userId },
      relations: ['items'],
    });
    await this.removeCarts(carts);
  }

  async clearByUserAndStoreId(userId: string, storeId: string): Promise<void> {
    const cart = await this.findCart(userId, storeId);
    await this.removeCarts(cart ? [cart] : []);
  }

  private async findCart(
    userId: string,
    storeId: string,
  ): Promise<Cart | null> {
    return this.cartRepo.findOne({
      where: { userId, storeId },
      relations: ['items'],
    });
  }

  private async getCartOrThrow(userId: string, storeId: string): Promise<Cart> {
    const cart = await this.findCart(userId, storeId);
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  private getItemOrThrow(cart: Cart, productCode: string): CartItem {
    const item = cart.items.find(
      (cartItem) => cartItem.productCode === productCode,
    );
    if (!item) throw new NotFoundException('Item not in cart');
    return item;
  }

  private async removeCarts(carts: Cart[]): Promise<void> {
    if (carts.length === 0) return;

    const items = carts.flatMap((cart) => cart.items);
    if (items.length > 0) {
      await this.itemRepo.remove(items);
    }

    await this.cartRepo.remove(carts);
  }

  private emptyCart(storeId: string | null = null) {
    return {
      id: null,
      store_id: storeId,
      items: [],
      item_count: 0,
      subtotal: 0,
      updated_at: null,
    };
  }

  private format(cart: Cart) {
    const items = (cart.items ?? []).map((item) => {
      const effectivePrice =
        Number(item.productDiscountPrice) || Number(item.productPrice);

      return {
        id: item.id,
        product_code: item.productCode,
        product_name: item.productName,
        product_price: Number(item.productPrice),
        product_discount_price: Number(item.productDiscountPrice),
        effective_price: effectivePrice,
        quantity: item.quantity,
        line_total: effectivePrice * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);

    return {
      id: cart.id,
      store_id: cart.storeId,
      items,
      item_count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
      updated_at: cart.updatedAt,
    };
  }
}
