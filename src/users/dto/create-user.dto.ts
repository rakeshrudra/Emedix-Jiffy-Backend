import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
    name: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email address of the user' })
    email: string;
}
