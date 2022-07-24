---
status: proposed
date: 2022-07-20
---

# 0003 - Implement an application error system

## Context and Problem Statement

The following types of classes are raising exceptions, specifically `BadRequestException` (`400 Bad Request`):

- Repositories

  - `entries.repository.ts`
  - `conversation.repository.ts`
  - `categories.repository.ts`
  - `conversations.repository.ts`
  - `entries.repository.ts`
  - `title.repository.ts`
  - `user.repository.ts`
  - `jwt.manipulation.service.ts`
  - `jwt.strategy.ts`

- Domain Services
  - `auth.service.ts`
  - `user.services.ts`
  - `title.service.ts`
  - `cateogry.service.ts`

This might prove confusing the the frontend, since it's indicating that there is something wrong with the request (e.g. invalid syntax) such that the backend cannot understand what the request is.

When in fact, backend understands the request, but the request is failing due to validation failing.

```ts
// server/src/v1/Auth/Service/auth.service.ts

export class AuthService {
  async signIn(
    userEntity: UsersEntity,
    dto: LoginDto
  ): Promise<ISerializeResponse> {
    if (userEntity.is_banned)
      throw new BadRequestException("Account is banned");
    if (!userEntity.is_active)
      throw new BadRequestException("Account is not active");
    //..
  }
}
```

Furthermore, we have no way to monitor where errors are happening in our application, especially in production.

## Decision Drivers/Assumptions

Visibility of where errors are important for an early stage startup, especially we are direct to consumers.

The startup will eventually integrate error monitoring tools like sentry.io into the application.

## Decision Outcome

Create a custom application exceptions that extend from `HttpException` that will be caught by the `HttpExcceptionFilter` provided by `nestjs` framework.

### Positive Consequences

- Flexibility in adding more data to our exceptions to get Context

  - `debug_values` that provides the values in a `POST` request body
  - this in turn will prove useful when investigating issues

- Ability to provide error messages per field in `POST` request
  - Frontend can review

### Negative Consequences

- Engineering will need to adhere to the convention of using custom application http exceptions instead of using out-of-the-box `nestjs` error classes

## More Information

Create custom errors `src/shared/Errors` to store our errors that our application will throw.

```ts
// src/shared/Errors/base.error.this

class BaseError extends HttpException {
  constructor({ messages, debug_values }, status) {
    const response = { messages, debug_values };
    super(response, status);
  }
}

// Throw this error when validation in Services fail
class ValidationError extends HttpException {
  constructor({ title, messages, debug_values }) {
    const response = { title, messages, debug_values };
    const statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    super(response, statusCode);
  }
}

//
class UnprocessableEntityError extends HttpException {
  constructor(response, status);
}
```
