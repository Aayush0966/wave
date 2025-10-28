# @wave/error

Simple error handling for Wave applications.


```typescript
import { createError, WaveError, ErrorCode } from "@wave/error";

// Quick errors
throw createError.notFound("User not found");
throw createError.validation("Email is required");
throw createError.unauthorized();

// Custom error
throw new WaveError({
  code: ErrorCode.FORBIDDEN,
  message: "Access denied",
  metadata: { userId: 123 }
});
```

## Error Types

```typescript
enum ErrorCode {
  // Auth
  UNAUTHORIZED
  FORBIDDEN
  INVALID_CREDENTIALS
  
  // Validation
  VALIDATION_ERROR
  INVALID_INPUT
  
  // Resources
  NOT_FOUND
  ALREADY_EXISTS
  
  // Server
  INTERNAL_ERROR
  DATABASE_ERROR
}
```

## API Usage

```typescript
// API route
export async function getUser(id: string) {
  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw createError.notFound("User");
    return user;
  } catch (error) {
    const waveError = toWaveError(error);
    throw waveError; // Auto HTTP status codes
  }
}
```

## Error Handling

```typescript
import { isWaveError, getErrorMessage } from "@wave/error";

try {
  await riskyOperation();
} catch (error) {
  if (isWaveError(error)) {
    console.log(error.code, error.statusCode); // Structured
  } else {
    console.log(getErrorMessage(error)); // Safe fallback
  }
}
```

## Features

- ✅ Type-safe error codes
- ✅ Auto HTTP status mapping
- ✅ Metadata support
- ✅ Safe error conversion
- ✅ Simple factory methods