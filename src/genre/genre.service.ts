import { Injectable } from '@nestjs/common'
import { NotFoundException } from '@nestjs/common/exceptions'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { InjectModel } from 'nestjs-typegoose'
import { MovieService } from 'src/movie/movie.service'
import { CreateGenreDto } from './dto/create-genre.dto'
import { Collection } from './genre.interface'
import { GenreModel } from './genre.model'

@Injectable()
export class GenreService {
	constructor(
		@InjectModel(GenreModel) private readonly GenreModel: ModelType<GenreModel>,
		private readonly movieService: MovieService
	) {}

	async create() {
		const defaultValue: CreateGenreDto = {
			name: '',
			slug: '',
			description: '',
			icon: '',
		}

		const genre = await new this.GenreModel(defaultValue).save()
		return genre._id
	}

	async getCollections() {
		const genres = await this.getAll()
		const collections = await Promise.all(genres.map(async genre => {
			const moviesByGenre = await this.movieService.byGenres([genre._id])

			const result: Collection = {
				_id: String(genre._id),
				image: moviesByGenre[0].bigPoster,
				slug: genre.slug,
				title: genre.name
			}

			return result
		}))
		return collections
	}

	async getOneBySlug(slug: string) {
		const genre = await this.GenreModel.findOne({ slug })
		if (!genre) throw new NotFoundException('Genre not found')

		return genre
	}

	async getOneById(_id: string) {
		const genre = await this.GenreModel.findById(_id)
		if (!genre) throw new NotFoundException('Genre not found')

		return genre
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
					{
						description: new RegExp(searchTerm, 'i'),
					},
				],
			}
		}
		return this.GenreModel.find(options)
			.select('-updatedAt -__v')
			.sort({ createdAt: 'desc' })
			.exec()
	}

	async update(_id: string, dto: CreateGenreDto) {
		const updatedGenre = await this.GenreModel.findByIdAndUpdate(_id, dto, {
			new: true,
		}).exec()

		if (!updatedGenre) throw new NotFoundException('Genre not found')

		return updatedGenre
	}

	async delete(_id: string) {
		const deletedGenre = await this.GenreModel.findByIdAndDelete(_id).exec()
		if (!deletedGenre) throw new NotFoundException('Genre not found')

		return
	}
}
