import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RepoService } from "./repo.service";
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RepoService],
})
export class AppModule {}
