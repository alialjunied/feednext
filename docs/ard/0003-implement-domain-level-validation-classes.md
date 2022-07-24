---
# These are optional elements. Feel free to remove any of them.
status: {proposed | rejected | accepted | deprecated | … | superseded by [ADR-0005](0005-example.md)}
date: {YYYY-MM-DD when the decision was last updated}
deciders: {list everyone involved in the decision}
consulted: {list everyone whose opinions are sought (typically subject-matter experts); and with whom there is a two-way communication}
informed: {list everyone who is kept up-to-date on progress; and with whom there is a one-way communication}
---

# 0004 - Implement domain-level validation classes

## Context and Problem Statement

Repositories are raising `HttpExceptions` like `BadRequestException` and `NotFoundException`.

The errors raised are namely from validating if the said action can be performed on the database table.

Take the following function from `entries.repository.ts`:

```js
export class EntriesRepository extends Repository<EntriesEntity> {
  // ...

  async updateEntry(
    username: string,
    entryId: string,
    text: string
  ): Promise<EntriesEntity> {
    let entry: EntriesEntity;

    // Validation 1: checking if the entry exists
    try {
      entry = await this.findOneOrFail(entryId);
    } catch {
      throw new NotFoundException("Entry could not found by given id");
    }

    // Validation 2: domain-level validation
    if (entry.written_by !== username)
      throw new BadRequestException(
        "Only author of the entry can update its entry"
      );

    // Validation 3: domain-level validation
    if (entry.text === text)
      throw new BadRequestException(
        "Text must be different than the current entry to update it"
      );

    try {
      entry.text = text;
      await this.save(entry);
      return entry;
    } catch (err) {
      // Coupling the delivery mechanism to the repository
      throw new BadRequestException(err.errmsg);
    }
  }

  // ...
}
```

## Decision Drivers/Assumptions

- Repositories should only be concerned with communicating with the database via `typeorm`

- Respositories should only implement logic pertaining to updating the entities in the database.

## Assumptions

- There is no way for us to get

## Decision Outcome

Move domain-level validation logic from Repositories to Validators.

- In the `updateEntry` example, we can see that an entry can only be updated by the author
  - This validation logic can be moved into a separate validator class, which will be called by the Service.

Create a generic `RepositoryException` for any `try-catch` blocks

- Acts as prep for next ARD that implements a custom error system, we will also c

### Positive Consequences

- Repositories will have a single responsibility
  - no longer need know which type http error it needs to raise.

### Negative Consequences

- Engineering needs to ensure they validate DTOs/requests in Service classes before calling the repository

## More Information

<!-- {You might want to provide additional evidence/confidence for the decision outcome here and/or document the team agreement on the decision and/or define when this decision when and how the decision should be realized and if/when it should be re-visited and/or how the decision is validated. Links to other decisions and resources might here appear as well.} -->

1. Create the `ServiceError` & `RepositoryError`

These error classes will be implemented before the team starts this refactor.

```ts
// src/shared/Errors/respository.error.ts
class RepositoryError extends HttpException {
  /**
   * @param {string} errMsg - error msg
   * @param {object} debugValues - for use later when integrating with error monitoring tool
   */
  constructor(errMsgs, debugValues) {
    const response = {
      messages: errMsgs,
    };
    // Represent repo errors as `500 Internal Server Error` since it is happening on the DB level
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    super(response, status);
  }
}

// src/shared/Errors/unprocessable-entity.error.ts
// Alternative names: `ServiceError`, `ValidationError`
class ServiceError extends HttpException {
  /**
   * @param {string} errMsgs - error msg
   * @param {object} debugValues - for use later when integrating with error monitoring tool
   */
  constructor(errMsgs, debugValues) {
    const response = {
      messages: errMsg,
    };
    // Represent this errors as `422 Unprocessable Entity Error`
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    super(response, status);
  }
}
```

2. Services now will call a Validator class before calling the respository

:::note

Previously, we split the service classes into smaller service classes

- from `EntryService.updateEntry` to `EntryUpdateService.execute`

:::

```js
// src/v1/Entry/Service/entry-update.service.ts
class EntryUpdateService {
  async execute(
    username: string,
    entryId: string,
    text: string
  ): Promise<EntriesEntity> {
    let entry: EntriesEntity;

    // Get an instance of the entry
    // Assumption: getEntry changed to return nil if id is not found
    entry = this.entriesRepository.getEntry(entryId);

    // Moving Validation 1 (from previous code example) into the service
    if (!entry) throw new NotFoundException("Entry could not be found");

    // Pass entry and values into the validator
    // To conduct Validation 2 & 3
    validator = this.updateValidator.new(entry, username, text);

    // Check if the entiry is updatable, provided the username and tet
    if (!this.updateValidator.isValid()) {
      const messages = this.updateValidator.messages;
      const debugValues = { entryId, username, text };
      throw new UnprocessableEntityError(messages, debugValues);
    }

    // At this point, the entity is updatable
    // Call repo to update the database
    entry = this.entriesRepository.updateEntry(entry);

    return entry;
  }
}
```

3. Implement the domain-level validation logic for updating an entry

```ts
// src/v1/Entry/Validator/entry-update.validator.ts
class EntryUpdateValidator {

  constructor(entry, username, text) {
    this.entry = entry
    this.username = username
    this.text = text
    this.errors = {
      username: [],
      text: []
    }
  }

    // All validators will have a `isValid` function that services will call
    isValid() {
      const isAuthor = isAuthor()
      const isTextDifferent = isTextDifferent()
      const isValid = isAuthor && isTextDifferent
      return isValid
    }

    isAuthor() {
      if (entry.written_by === username) return true
      errors.username.push('Only author of the entry can update its entry')
      return false
    }

    isTextDifferent() {
      if (entry.text !== text) return true
      errors.text.push('Only author of the entry can update its entry')
      return false
    }
  }
}
```

4. Remove validation logic in the repository

```ts
@EntityRepository(EntriesEntity)
export class EntriesRepository extends Repository<EntriesEntity> {
  // ...

  async updateEntry(
    entry: EntriesEntity,
    username: string,
    text: string
  ): Promise<EntriesEntity> {
    let entry: EntriesEntity;

    try {
      entry.text = text;
      await this.save(entry);
      return entry;
    } catch (err) {
      const errMsg = err.errmsg;
      const debugValues = entry;
      // raise a custom error that internally sets the Http error code
      throw new RepositoryError(errMsg, debugValues);
    }
  }

  // ...
}
```
