import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { InjectModel } from 'nestjs-typegoose'
import { BadRequestException } from '@nestjs/common'
import { hash, genSalt, compare } from 'bcryptjs'

import { AuthDto } from './dto/auth.dto'
import { UserModel } from 'src/user/user.model'
import { JwtService } from '@nestjs/jwt'
import { RefreshTokenDto } from './dto/refreshToken.dto'

@Injectable()
export class AuthService {
	constructor(
		@InjectModel(UserModel) private readonly UserModel: ModelType<UserModel>,
		private readonly jwtService: JwtService
	) {}

	async login(dto: AuthDto) {
		const user = await this.validateUser(dto)
		const tokens = await this.issueTokenPair(String(user._id))

		return {
			user: this.returnUserFields(user),
			...tokens,
		}
	}

	async getNewTokens({ refreshToken }: RefreshTokenDto) {
		if (!refreshToken) throw new UnauthorizedException('Please sign in')

		const result = await this.jwtService.verifyAsync(refreshToken)
		if (!result) throw new UnauthorizedException('Invalid token or expired')

		const user = await this.UserModel.findById(result._id)
		const tokens = await this.issueTokenPair(String(user._id))

		return {
			user: this.returnUserFields(user),
			...tokens,
		}
	}

	async register(dto: AuthDto) {
		const { email, password } = dto

		const oldUser = await this.UserModel.findOne({ email: dto.email })
		if (oldUser) {
			throw new BadRequestException('User with this email is already exist')
		}
		const salt = await genSalt(3)

		const newUser = new this.UserModel({
			email,
			password: await hash(password, salt),
		})
		await newUser.save()

		const tokens = await this.issueTokenPair(String(newUser._id))

		return {
			user: this.returnUserFields(newUser),
			...tokens,
		}
	}

	private async validateUser(dto: AuthDto) {
		const { email, password } = dto
		const user = await this.UserModel.findOne({ email })
		if (!user) throw new UnauthorizedException('User is not found')

		const isValidPassword = await compare(password, user.password)
		if (!isValidPassword) throw new UnauthorizedException('Invalid password')

		return user
	}

	async issueTokenPair(userId: string) {
		const data = { _id: userId }

		const refreshToken = await this.jwtService.signAsync(data, {
			expiresIn: '15d',
		})

		const accessToken = await this.jwtService.signAsync(data, {
			expiresIn: '1h',
		})

		return { refreshToken, accessToken }
	}

	private returnUserFields(user: UserModel) {
		return {
			_id: user._id,
			email: user.email,
			isAdmin: user.isAdmin,
		}
	}
}
