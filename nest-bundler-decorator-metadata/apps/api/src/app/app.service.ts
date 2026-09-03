import { Injectable } from '@nestjs/common';
import { RepoService } from './repo.service';

@Injectable()
export class AppService {
  // The default scaffold has no constructor dependency, so it cannot show
  // the failure. This one has to resolve RepoService.
  constructor(private readonly repo: RepoService) {}

  getData(): { message: string } {
    return { message: this.repo.find() };
  }
}
