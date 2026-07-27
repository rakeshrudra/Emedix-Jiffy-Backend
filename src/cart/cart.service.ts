import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { ProductStatus } from '../products/entities/product.entity';
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

  async getCart(user_id: string, store_id?: string) {
    if (store_id) {
      const cart = await this.findCart(user_id, store_id);
      return {
        success: true,
        data: cart ? this.format(cart) : this.emptyCart(store_id),
      };
    }

    const carts = await this.cartRepo.find({
      where: { user_id: user_id },
      relations: ['items'],
      order: { updated_at: 'DESC' },
    });

    return {
      success: true,
      data: {
        carts: carts.map((cart) => this.format(cart)),
        cart_count: carts.length,
      },
    };
  }

  async addItem(user_id: string, dto: AddItemDto) {
    const product = await this.productsService.findByCode(
      dto.store_id,
      dto.product_code,
    );
    if (!product)
      throw new NotFoundException('Product not found in this store');

    let cart = await this.findCart(user_id, dto.store_id);

    if (!cart) {
      cart = await this.cartRepo.save(
        this.cartRepo.create({ user_id: user_id, store_id: dto.store_id, items: [] }),
      );
    }

    const existing = cart.items.find(
      (item) => item.product_code === dto.product_code,
    );
    const requestedQuantity = existing ? existing.quantity + 1 : 1;
    this.productsService.assertAvailable(
      product,
      product.product_name,
      requestedQuantity,
    );

    if (existing) {
      existing.quantity = requestedQuantity;
      await this.itemRepo.save(existing);
    } else {
      await this.itemRepo.save(
        this.itemRepo.create({
          cart,
          product_code: product.product_code,
          product_name: product.product_name,
          product_price: Number(product.product_price) || 0,
          product_discount_price: Number(product.product_discount_price) || 0,
          quantity: 1,
        }),
      );
    }

    return {
      success: true,
      data: this.format(await this.getCartOrThrow(user_id, dto.store_id)),
    };
  }

  async updateItem(
    user_id: string,
    product_code: string,
    dto: UpdateItemDto,
    store_id: string,
  ) {
    const cart = await this.getCartOrThrow(user_id, store_id);
    const item = this.getItemOrThrow(cart, product_code);

    if (dto.quantity === 0) {
      await this.itemRepo.remove(item);
    } else {
      const product = await this.productsService.findByCode(
        cart.store_id,
        product_code,
      );
      this.productsService.assertAvailable(
        product,
        item.product_name,
        dto.quantity,
      );

      item.quantity = dto.quantity;
      await this.itemRepo.save(item);
    }

    return {
      success: true,
      data: this.format(await this.getCartOrThrow(user_id, cart.store_id)),
    };
  }

  async removeItem(user_id: string, product_code: string, store_id: string) {
    const cart = await this.getCartOrThrow(user_id, store_id);
    const item = this.getItemOrThrow(cart, product_code);

    await this.itemRepo.remove(item);

    return {
      success: true,
      data: this.format(await this.getCartOrThrow(user_id, cart.store_id)),
    };
  }

  async clearCart(user_id: string, store_id: string) {
    await this.clearByUserAndStoreId(user_id, store_id);
    return { success: true, message: 'Cart cleared' };
  }

  async validateCart(user_id: string, store_id: string) {
    const cart = await this.findCart(user_id, store_id);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const issues: string[] = [];
    const itemResults: any[] = [];

    for (const cartItem of cart.items) {
      const product = await this.productsService.findByCode(
        cart.store_id,
        cartItem.product_code,
      );

      const itemResult: any = {
        product_code: cartItem.product_code,
        product_name: cartItem.product_name,
        quantity: cartItem.quantity,
        cart_price:
          Number(cartItem.product_discount_price) ||
          Number(cartItem.product_price),
        issues: [],
      };

      const availabilityIssues = this.productsService.checkAvailability(
        product,
        cartItem.quantity,
      );
      itemResult.issues.push(...availabilityIssues);
      itemResult.available =
        product?.status === ProductStatus.ENABLE &&
        this.productsService.parseStock(product) > 0;

      if (product && itemResult.available) {
        const stock = this.productsService.parseStock(product);
        if (cartItem.quantity > stock) itemResult.max_quantity = stock;

        const currentPrice = this.productsService.getEffectivePrice(product);
        const cartPrice =
          Number(cartItem.product_discount_price) ||
          Number(cartItem.product_price);

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
            (issue: string) => `${cartItem.product_name}: ${issue}`,
          ),
        );
      }
    }

    return {
      success: true,
      data: {
        store_id: cart.store_id,
        valid: issues.length === 0,
        issues,
        items: itemResults,
      },
    };
  }

  async clearByUserId(user_id: string): Promise<void> {
    const carts = await this.cartRepo.find({
      where: { user_id: user_id },
      relations: ['items'],
    });
    await this.removeCarts(carts);
  }

  async clearByUserAndStoreId(user_id: string, store_id: string): Promise<void> {
    const cart = await this.findCart(user_id, store_id);
    await this.removeCarts(cart ? [cart] : []);
  }

  /**
   * Raw cart entity for a user+store, for internal use by other services
   * (e.g. OrdersService building order items from cart contents).
   */
  async getActiveCart(user_id: string, store_id: string): Promise<Cart | null> {
    return this.findCart(user_id, store_id);
  }

  private async findCart(
    user_id: string,
    store_id: string,
  ): Promise<Cart | null> {
    return this.cartRepo.findOne({
      where: { user_id: user_id, store_id: store_id },
      relations: ['items'],
    });
  }

  private async getCartOrThrow(user_id: string, store_id: string): Promise<Cart> {
    const cart = await this.findCart(user_id, store_id);
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  private getItemOrThrow(cart: Cart, product_code: string): CartItem {
    const item = cart.items.find(
      (cartItem) => cartItem.product_code === product_code,
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

  private emptyCart(store_id: string | null = null) {
    return {
      id: null,
      store_id: store_id,
      items: [],
      item_count: 0,
      subtotal: 0,
      updated_at: null,
    };
  }

  private format(cart: Cart) {
    const items = (cart.items ?? []).map((item) => {
      const effectivePrice =
        Number(item.product_discount_price) || Number(item.product_price);

      return {
        id: item.id,
        product_code: item.product_code,
        product_name: item.product_name,
        product_price: Number(item.product_price),
        product_discount_price: Number(item.product_discount_price),
        effective_price: effectivePrice,
        quantity: item.quantity,
        line_total: effectivePrice * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);

    return {
      id: cart.id,
      store_id: cart.store_id,
      items,
      item_count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
      updated_at: cart.updated_at,
    };
  }
}
