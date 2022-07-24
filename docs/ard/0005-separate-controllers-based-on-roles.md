---
# These are optional elements. Feel free to remove any of them.
status: {proposed | rejected | accepted | deprecated | … | superseded by [ADR-0005](0005-example.md)}
date: {YYYY-MM-DD when the decision was last updated}
deciders: {list everyone involved in the decision}
consulted: {list everyone whose opinions are sought (typically subject-matter experts); and with whom there is a two-way communication}
informed: {list everyone who is kept up-to-date on progress; and with whom there is a one-way communication}
---

# 0004 - Seperate controllers based on roles

## Context and Problem Statement

Looking at `server/src/shared/Enums/Roles/index.ts`, there are 6 different roles.

- User
- JuniorAuthor
- MidLevelAuthor
- SeniorAuthor
- Admin
- SuperAdmin

The following controllers serve more than 1 role.

- `category.controller`
  - SuperAdmin
- `entry.controller`
  - User
  - SuperAdmin
- `title.controller`
  - User
  - Admin
  - SuperAdmin
- `user.controller`
  - User
  - Admin

## Decision Drivers/Assumptions

- Unused roles in `/Enums/Roles/index.ts` might have been added initially for planned future functionality
- As the startup grows, new roles may added in the future, which may have very specific business logic for that role

## Legend

| term | example |
| --- | --- |
| entity controller | `v1/Category/Controller/category.controller.ts` |
| role-based entity controller | `v1/Cateogry/Controller/controller grouped by role |

## Considered Options

- Create a separate endpoints for each role routing to entity controllers grouped by role.

  - e.g. /v1/super_admin/category /v1/admin/category

- Keep existing endpoints but have `nest-interceptor` to route to entity controllers grouped by role.
  - Super Admin -> `GET /v1/category` -> `nest-inceptor` -> `/v1/Category/super-admin.controller.ts`

## Decision Outcome

Chosen:

- Keep existing endpoints but have `nest-interceptor` to route to entity controllers grouped by role.

**Assumption:**

`nest-interceptor` allows us to read the role in the jwt and forward the request to the approriate controller

### Positive Consequences

- No change to the frontend as endpoints remain the same
- Able to logically group endpoints for different types of roles
- Easily extend specific functionality for certain roles within that role namespace.

<!-- This is an optional element. Feel free to remove. -->

### Negative Consequences

- More files/code, specifically controllers to manage
- For the current number of roles implemented, it might seem redundant due to nestjs providing role-based access control via `@Roles`

## Pros and Cons of the Options

### Create a separate endpoints for each role (v1/super_admin/, v1/admin) routing to entity controllers grouped by role.

- Good, because we can logically group endpoints for diffrent types of roles
- Bad, because frontend complexity will increase as they would need to have logic to determine which endpoint to call
- Neutral, because new files need to be added for every new role.
- Good, because new entity controller

### Keep existing endpoints but have `nest-interceptor` to route to entity controllers grouped by role.

- Good, because frontend does not require any changes
- Good, because we can logically group endpoints for diffrent types of roles
- Neutral, because routing might not be clear since it is actually happening in the `nest-inteceptor`. Training and documentation is vital for this to work in a sizable team
- Bad, because {argument d}
- …

## More Information

{You might want to provide additional evidence/confidence for the decision outcome here and/or document the team agreement on the decision and/or define when this decision when and how the decision should be realized and if/when it should be re-visited and/or how the decision is validated. Links to other decisions and resources might here appear as well.}
