import { Injectable } from '@nestjs/common';

@Injectable()
export class RepoService {
  find() {
    return 'from-repo';
  }
}
