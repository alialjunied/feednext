---
status: proposed
date: 2022-07-20
---

# 0002 - Move serialization to the controllers

## Context and Problem Statement

Service classes are tightly coupled to the Delivery Mechanism

```ts
export class CategoryShowService {
  //...

  async execute(categoryId: string): Promise<ISerializeResponse> {
    if (!this.validator.isMongoId(categoryId))
      throw new BadRequestException("Id must be a type of MongoId");

    const category: CategoriesEntity =
      await this.categoriesRepository.getCategory(categoryId);

    // coupling to delivery mechanism
    return serializerService.serializeResponse("category_detail", category);
  }
  //...
}
```

## Decision Drivers/Assumptions

Service classes should not know about the delivery mechanism of the application.

They should only care about executing domain logic.

## Decision Outcome

Move `serializationService` from Service class to Controllers

### Positive Consequences

- Services now are only concerned with domain logic.

- Setting up the codebase in the event we require fine-grained control over which attributes should be rendered per entity
  - Replacing `serializationService` in the required controller without affecting other controllers
  - For example, replacing it wth an "entity serialization service" (e.g. `categorySerializationService`)

### Negative Consequences

- Controller has one more dependency
  - Adding `serializationService` as an attribute in its constructor

## More Information

Controllers are the Delivery Mechanisms of the application.

Controllers receive the request, and are responsible for converting the data it gets from the service into its specified response via the `serializationService`.

```ts
// server/src/v1/Category/Controller/category.controller.ts

@ApiTags("v1/category")
@Controller()
export class CategoryController {
  constructor(
    private readonly showService: CategoryShowService,
    private readonly serializationService: serializationService
  ) {}

  @Get(":categoryId")
  getCategory(
    @Param("categoryId") categoryId: string
  ): Promise<ISerializeResponse> {
    // before (after 0001)
    // return this.showService.execute(categoryId)

    // after
    const category = this.showService.execute(categoryId);
    const response = serializationService.serializeResponse(
      "category_detail",
      category
    );
  }

  //...
}
```
