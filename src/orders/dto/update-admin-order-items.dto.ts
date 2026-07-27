import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'uniqueOrderItemIds', async: false })
class UniqueOrderItemIdsConstraint implements ValidatorConstraintInterface {
  validate(items: UpdateAdminOrderItemDto[] | undefined): boolean {
    if (!Array.isArray(items)) return false;
    const ids = items.map((item) => item.order_item_id);
    return new Set(ids).size === ids.length;
  }

  defaultMessage(): string {
    return 'items must not contain duplicate order_item_id values';
  }
}

export class UpdateAdminOrderItemDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  order_item_id: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_available: boolean;

  @ApiProperty({ example: 3, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  confirmed_quantity: number;
}

export class UpdateAdminOrderItemsDto {
  @ApiProperty({
    type: [UpdateAdminOrderItemDto],
    example: [
      { order_item_id: 1, is_available: true, confirmed_quantity: 3 },
      { order_item_id: 2, is_available: false, confirmed_quantity: 0 },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateAdminOrderItemDto)
  @Validate(UniqueOrderItemIdsConstraint)
  items: UpdateAdminOrderItemDto[];
}
