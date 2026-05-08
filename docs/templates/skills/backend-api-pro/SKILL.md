---
name: backend-api-pro
---

# Backend API Pro - Development Guidelines

## Overview

Comprehensive backend development guide for Node.js/Express APIs with TypeScript.
Covers API design, database patterns, security, testing, and deployment.

## When to Apply

- Building new API endpoints
- Designing database schemas
- Implementing authentication/authorization
- Setting up middleware
- Writing tests
- Optimizing performance

## Priority Categories

| Priority | Category | Impact | Domain |
|----------|----------|--------|--------|
| 1 | Security | CRITICAL | auth, middleware |
| 2 | Error Handling | CRITICAL | api, errors |
| 3 | Database | HIGH | db, prisma |
| 4 | Validation | HIGH | validation, zod |
| 5 | Logging | MEDIUM | logging, monitoring |
| 6 | Testing | MEDIUM | tests, jest |
| 7 | Performance | MEDIUM | perf, cache |
| 8 | Documentation | LOW | docs, openapi |

## Security Guidelines (CRITICAL)

### Authentication
- Use JWT with short expiration (15-30 min access, 7-30 day refresh)
- Store tokens securely (httpOnly cookies)
- Implement proper CORS settings
- Use bcrypt with salt rounds 12+ for passwords

### Input Validation
```typescript
// Always validate with Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});
```

### SQL Injection Prevention
- Use parameterized queries (Prisma ORM)
- Never concatenate strings into SQL
- Validate all inputs before database operations

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## API Design Patterns

### Response Format
```typescript
// Standard success response
{
  success: true,
  data: { ... },
  meta: { page: 1, limit: 10, total: 100 }
}

// Standard error response
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: [ ... ]
  }
}
```

### Status Codes
- 200: OK (GET, PUT success)
- 201: Created (POST success)
- 400: Bad Request (validation error)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (no permission)
- 404: Not Found
- 409: Conflict (duplicate, etc.)
- 422: Unprocessable Entity
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error

### Route Structure
```
src/
├── routes/
│   ├── index.ts          # Route aggregator
│   ├── auth.routes.ts    # /api/auth/*
│   ├── users.routes.ts   # /api/users/*
│   └── jobs.routes.ts    # /api/jobs/*
├── controllers/
│   ├── auth.controller.ts
│   ├── users.controller.ts
│   └── jobs.controller.ts
├── services/
│   ├── auth.service.ts
│   ├── users.service.ts
│   └── jobs.service.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validate.middleware.ts
└── types/
    └── index.ts
```

## Database Best Practices

### Prisma Schema Patterns
```prisma
// Always use UUID for IDs
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  jobs      Job[]
  
  @@index([email])
  @@index([role])
}

enum Role {
  USER
  STAFF
  ADMIN
  SUPERVISOR
}
```

### Query Optimization
```typescript
// Bad - N+1 problem
const users = await prisma.user.findMany();
for (const user of users) {
  const jobs = await prisma.job.findMany({ where: { userId: user.id } });
}

// Good - Include relations
const users = await prisma.user.findMany({
  include: {
    jobs: {
      where: { status: 'PENDING' }
    }
  }
});
```

## Error Handling

### Centralized Error Middleware
```typescript
// middleware/error.middleware.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: err.errors
      }
    });
  }
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }
  
  // Unknown error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong'
    }
  });
};
```

## Pre-Delivery Checklist

### Security
- [ ] Input validation with Zod on all endpoints
- [ ] Authentication middleware on protected routes
- [ ] Authorization checks (RBAC) implemented
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] No secrets in code (use .env)
- [ ] SQL injection prevention (parameterized queries)

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types (use `unknown` with type guards)
- [ ] Consistent error handling
- [ ] Proper async/await usage (no floating promises)
- [ ] Comments for complex logic

### API Design
- [ ] RESTful endpoints
- [ ] Consistent response format
- [ ] Proper HTTP status codes
- [ ] Pagination for list endpoints
- [ ] Filtering and sorting support

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for endpoints
- [ ] Database cleaned up after tests

### Documentation
- [ ] OpenAPI/Swagger spec
- [ ] README with setup instructions
- [ ] Environment variables documented
