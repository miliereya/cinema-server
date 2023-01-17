import { IsString } from "class-validator"
import { IsEmail, MaxLength, MinLength } from "class-validator"

export class AuthDto {
  @IsEmail()
  email: string

  @MinLength(6, {
    message: 'Password cannot be less than 6 characters!',
  })
  @MaxLength(20, {
    message: 'Password cannot be more than 20 characters!',
  })
  @IsString()
  password: string
}