import { Controller, Get, Param } from "@nestjs/common";
import { NewsService } from "./news.service";
import { Public } from "src/common/decorators/public.decorator";

@Controller('news')
export class NewsPublicController {
  constructor(private readonly service: NewsService) {}

  @Public()
  @Get()
  findPublished() {
    return this.service.findPublished();
  }

  @Public()
  @Get(":slug")
  findNewsDetail( @Param('slug') slug: string,) {
    return this.service.findBySlug(slug);
  }
}
