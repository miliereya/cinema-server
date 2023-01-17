import { prop } from '@typegoose/typegoose'
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses'

export interface GenreModel extends Base {}

export class GenreModel extends TimeStamps {
	@prop({ unique: true })
	name: string
	@prop()
	slug: string
	@prop()
	description: string
	@prop()
	icon: string
}
