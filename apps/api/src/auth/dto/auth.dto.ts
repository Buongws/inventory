import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "student@example.com" }) @IsEmail() email!: string;
  @ApiProperty({ minLength: 12, example: "Dinhcongmanh1@" })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}
export class LoginDto extends RegisterDto {}
