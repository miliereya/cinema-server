import { ConfigService } from '@nestjs/config'
import { TypegooseModuleOptions } from 'nestjs-typegoose'

const options = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
}

export const getMongoDbConfig = async (
  configService: ConfigService
): Promise<TypegooseModuleOptions> => ({
  uri: configService.get('MONGO_URI'),
  ...options
})