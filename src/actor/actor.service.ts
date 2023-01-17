import { Injectable, NotFoundException } from '@nestjs/common'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { InjectModel } from 'nestjs-typegoose'
import { ActorModel } from './actor.model'
import { ActorDto } from './dto/actor.dto'

@Injectable()
export class ActorService {
	constructor(
		@InjectModel(ActorModel) private readonly ActorModel: ModelType<ActorModel>
	) {}

	async bySlug(slug: string) {
		const actor = await this.ActorModel.findOne({ slug })
		if (!actor) throw new NotFoundException('Actor not found')

		return actor
	}

	async byId(_id: string) {
		const actor = await this.ActorModel.findById(_id)
		if (!actor) throw new NotFoundException('Actor not found')

		return actor
	}

	async getAll(searchTerm?: string) {
		let options = {}

		if (searchTerm) {
			options = {
				$or: [
					{
						name: new RegExp(searchTerm, 'i'),
					},
					{
						slug: new RegExp(searchTerm, 'i'),
					},
				],
			}
		}
		return this.ActorModel.aggregate()
			.match(options)
			.lookup({
				from: 'Movie',
				localField: '_id',
				foreignField: 'actors',
				as: 'movies',
			})
			.addFields({
				countMovies: {
					$size: '$movies',
				},
			})
			.project({ __v: 0, updatedAt: 0, movies: 0 })
			.sort({ createdAt: -1 })
			.exec()
	}

	async create() {
		const defaultValue: ActorDto = {
			name: '',
			slug: '',
			photo: '',
		}
		const actor = new this.ActorModel(defaultValue)
		await actor.save()

		return actor._id
	}

	async update(_id: string, dto: ActorDto) {
		const updatedActor = await this.ActorModel.findByIdAndUpdate(_id, dto, {
			new: true,
		})

		if (!updatedActor) throw new NotFoundException('Actor not found')

		return updatedActor
	}

	async delete(_id: string) {
		const deletedActor = this.ActorModel.findByIdAndDelete(_id).exec()
		if (!deletedActor) throw new NotFoundException('Actor not found')

		return deletedActor
	}
}
