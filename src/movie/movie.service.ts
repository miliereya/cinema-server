import { Injectable, NotFoundException, Type } from '@nestjs/common'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { Types } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import { UpdateMovieDto } from './dto/update-movie.dto'
import { MovieModel } from './movie.model'

@Injectable()
export class MovieService {
	constructor(
		@InjectModel(MovieModel) private readonly MovieModel: ModelType<MovieModel>
	) {}

	async getMostPopular() {
		return this.MovieModel.find({ countOpened: { $gt: 0 } })
			.sort({ countOpened: -1 })
			.populate('genres')
			.exec()
	}

	async bySlug(slug: string) {
		const movie = await this.MovieModel.findOne({ slug }).populate(
			'actors genres'
		)
		if (!movie) throw new NotFoundException('Movie not found')

		return movie
	}

	async byActor(actorId: Types.ObjectId) {
		const movies = await this.MovieModel.find({ actors: actorId })
		if (!movies) throw new NotFoundException('Movies not found')

		return movies
	}

	async byGenres(genreIds: Types.ObjectId[]) {
		const movies = await this.MovieModel.find({
			genres: { $in: genreIds },
		})

		if (!movies) throw new NotFoundException('Movie not found')

		return movies
	}

	async byId(_id: string) {
		const movie = await this.MovieModel.findById(_id)
		if (!movie) throw new NotFoundException('Movie not found')

		return movie
	}

	async updateRating(id: Types.ObjectId, newRating: number) {
		return this.MovieModel.findByIdAndUpdate(
			id,
			{
				rating: newRating,
			},
			{
				new: true,
			}
		).exec()
	}

	async updateCountOpened(slug: string) {
		const updatedMovie = await this.MovieModel.findOneAndUpdate(
			{ slug },
			{
				$inc: { countOpened: 1 },
			},
			{ new: true }
		)

		if (!updatedMovie) throw new NotFoundException('Movie not found')

		return updatedMovie
	}

	async getAll(searchTerm?: string) {
		let options = {}

		if (searchTerm) {
			options = {
				$or: [
					{
						title: new RegExp(searchTerm, 'i'),
					},
				],
			}
		}
		return this.MovieModel.find(options)
			.select('-updatedAt -__v')
			.sort({ createdAt: 'desc' })
			.populate('actors genres')
			.exec()
	}

	async create() {
		const defaultValue: UpdateMovieDto = {
			bigPoster: '',
			actors: [],
			genres: [],
			description: '',
			poster: '',
			title: '',
			videoUrl: '',
			slug: '',
		}
		const movie = new this.MovieModel(defaultValue)
		await movie.save()

		return movie._id
	}

	async update(_id: string, dto: UpdateMovieDto) {
		const updatedMovie = await this.MovieModel.findByIdAndUpdate(_id, dto, {
			new: true,
		})

		if (!updatedMovie) throw new NotFoundException('Movie not found')

		return updatedMovie
	}

	async delete(_id: string) {
		const deletedMovie = this.MovieModel.findByIdAndDelete(_id).exec()
		if (!deletedMovie) throw new NotFoundException('Movie not found')

		return deletedMovie
	}
}
