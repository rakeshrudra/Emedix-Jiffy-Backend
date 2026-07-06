import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) { }

  // ─── GET /api/cart ───────────────────────────────────────────────────────────

  async getCart(userId: string) {
    const cart = await this.cartRepo.findOne({ where: { userId }, relations: ['items'] });

    if (!cart) {
      return {
        success: true,
        data: {
          id: null,
          store_id: null,
          items: [],
          item_count: 0,
          subtotal: 0,
          updated_at: null,
        },
      };
    }

    return { success: true, data: this.format(cart) };
  }

  // ─── POST /api/cart/items ────────────────────────────────────────────────────

  async addItem(userId: string, dto: AddItemDto) {
    const product = await this.productRepo.findOne({
      where: { productCode: dto.product_code, storeId: dto.store_id },
    });

    if (!product) throw new NotFoundException('Product not found in this store');
    if (product.status !== 'Enable') throw new BadRequestException('Product is not available');
    if (parseInt(product.productStock, 10) <= 0) throw new BadRequestException('Product is out of stock');

    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (cart && cart.storeId !== dto.store_id) {
      throw new BadRequestException(
        'Your cart has items from a different store. Clear your cart to switch stores.',
      );
    }

    if (!cart) {
      cart = this.cartRepo.create({ userId, storeId: dto.store_id, items: [] });
      await this.cartRepo.save(cart);
    }

    const existing = cart.items.find((i) => i.productCode === dto.product_code);

    if (existing) {
      existing.quantity += 1;
      await this.itemRepo.save(existing);
    } else {
      const price = parseFloat(product.productPrice) || 0;
      const discountPrice = parseFloat(product.productDiscountPrice) || 0;
      const item = this.itemRepo.create({
        cart,
        productCode: product.productCode,
        productName: product.productName,
        productPrice: price,
        productDiscountPrice: discountPrice,
        quantity: 1,
      });
      await this.itemRepo.save(item);
    }

    const updated = await this.cartRepo.findOne({ where: { id: cart.id }, relations: ['items'] });
    return { success: true, data: this.format(updated) };
  }

  // ─── PATCH /api/cart/items/:productCode ─────────────────────────────────────

  async updateItem(userId: string, productCode: string, dto: UpdateItemDto) {
    const cart = await this.cartRepo.findOne({ where: { userId }, relations: ['items'] });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find((i) => i.productCode === productCode);
    if (!item) throw new NotFoundException('Item not in cart');

    if (dto.quantity === 0) {
      await this.itemRepo.remove(item);
    } else {
      const product = await this.productRepo.findOne({
        where: { productCode, storeId: cart.storeId },
      });

      if (!product || product.status !== 'Enable') {
        throw new BadRequestException('Product is no longer available');
      }

      const stock = parseInt(product.productStock, 10) || 0;
      if (dto.quantity > stock) {
        throw new BadRequestException(
          stock === 0
            ? 'Product is out of stock'
            : `Only ${stock} unit(s) available`,
        );
      }

      item.quantity = dto.quantity;
      await this.itemRepo.save(item);
    }

    const updated = await this.cartRepo.findOne({ where: { id: cart.id }, relations: ['items'] });
    return { success: true, data: this.format(updated) };
  }

  // ─── DELETE /api/cart/items/:productCode ─────────────────────────────────────

  async removeItem(userId: string, productCode: string) {
    const cart = await this.cartRepo.findOne({ where: { userId }, relations: ['items'] });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find((i) => i.productCode === productCode);
    if (!item) throw new NotFoundException('Item not in cart');

    await this.itemRepo.remove(item);
    const updated = await this.cartRepo.findOne({ where: { id: cart.id }, relations: ['items'] });
    return { success: true, data: this.format(updated) };
  }

  // ─── DELETE /api/cart ────────────────────────────────────────────────────────

  async clearCart(userId: string) {
    const cart = await this.cartRepo.findOne({ where: { userId }, relations: ['items'] });
    if (cart) {
      await this.itemRepo.remove(cart.items);
      await this.cartRepo.remove(cart);
    }
    return { success: true, message: 'Cart cleared' };
  }

  // ─── POST /api/cart/validate ─────────────────────────────────────────────────
  // Checks cart contents only: stock availability and price changes.
  // Location/reachability is handled by the frontend via GET /api/stores/reachable.

  async validateCart(userId: string) {
    const cart = await this.cartRepo.findOne({ where: { userId }, relations: ['items'] });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const issues: string[] = [];
    const itemResults: any[] = [];

    for (const cartItem of cart.items) {
      const product = await this.productRepo.findOne({
        where: { productCode: cartItem.productCode, storeId: cart.storeId },
      });

      const itemResult: any = {
        product_code: cartItem.productCode,
        product_name: cartItem.productName,
        quantity: cartItem.quantity,
        cart_price: Number(cartItem.productDiscountPrice) || Number(cartItem.productPrice),
        issues: [],
      };

      if (!product || product.status !== 'Enable') {
        itemResult.issues.push('Product is no longer available');
        itemResult.available = false;
      } else {
        const stock = parseInt(product.productStock, 10) || 0;
        const currentPrice = parseFloat(product.productDiscountPrice) || parseFloat(product.productPrice) || 0;
        const cartPrice = Number(cartItem.productDiscountPrice) || Number(cartItem.productPrice);

        if (stock <= 0) {
          itemResult.issues.push('Out of stock');
          itemResult.available = false;
        } else if (stock < cartItem.quantity) {
          itemResult.issues.push(`Only ${stock} unit(s) available`);
          itemResult.available = true;
          itemResult.max_quantity = stock;
        } else {
          itemResult.available = true;
        }

        if (Math.abs(currentPrice - cartPrice) > 0.01) {
          itemResult.issues.push(`Price changed from ₹${cartPrice} to ₹${currentPrice}`);
          itemResult.current_price = currentPrice;
        }
      }

      itemResults.push(itemResult);
      if (itemResult.issues.length > 0) {
        issues.push(...itemResult.issues.map((i: string) => `${cartItem.productName}: ${i}`));
      }
    }

    return {
      success: true,
      data: {
        valid: issues.length === 0,
        issues,
        items: itemResults,
      },
    };
  }

  // ─── Internal helper used by OrdersService to clear cart post-order ──────────

  async clearByUserId(userId: string): Promise<void> {
    const cart = await this.cartRepo.findOne({ where: { userId }, relations: ['items'] });
    if (cart) {
      await this.itemRepo.remove(cart.items);
      await this.cartRepo.remove(cart);
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private format(cart: Cart) {
    const items = (cart.items ?? []).map((i) => ({
      id: i.id,
      product_code: i.productCode,
      product_name: i.productName,
      product_price: Number(i.productPrice),
      product_discount_price: Number(i.productDiscountPrice),
      effective_price: Number(i.productDiscountPrice) || Number(i.productPrice),
      quantity: i.quantity,
      line_total: (Number(i.productDiscountPrice) || Number(i.productPrice)) * i.quantity,
    }));

    const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);

    return {
      id: cart.id,
      store_id: cart.storeId,
      items,
      item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
      updated_at: cart.updatedAt,
    };
  }
}
