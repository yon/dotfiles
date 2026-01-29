# Rust SDK/Library Design Patterns

Guidelines for building production-quality Rust libraries and SDKs.

## Type Safety & Compile-Time Guarantees

1. **Use generics to encode constraints** - Make invalid states unrepresentable. If an operation requires authentication, make the type generic over an `Authenticator` trait so unauthenticated calls fail at compile time, not runtime.

2. **Use newtype wrappers for domain IDs** - Wrap strings like `UserId(String)`, `OrderId(String)` to prevent accidentally passing the wrong ID type. Derive `Deref` for ergonomic access when needed.

3. **Validate schemas at compile time** - If the library accepts user-defined types that must conform to a schema, use procedural macros to validate at compile time rather than failing at runtime during serialization.

4. **Use `#[non_exhaustive]` on public enums** - Allows adding variants without breaking downstream code. Essential for error enums and any enum that may grow.

## Trait-Based Design

5. **Define traits at abstraction boundaries** - Identify where users might want to swap implementations (auth, signing, storage, transport) and define traits there. Keep traits focused and minimal.

6. **Use associated types for related errors** - `type Error: std::error::Error` in traits lets each implementation define its own error type while maintaining a common interface.

7. **Require `Send + Sync` bounds on async traits** - If the library will be used in async contexts, ensure trait bounds support multi-threaded runtimes.

## Error Handling

8. **Use structured, context-rich errors** - Each error variant should carry relevant context (URL, status code, request ID). Use `snafu` or `thiserror` for ergonomic error definition.

9. **Separate transport errors from domain errors** - Distinguish between "couldn't reach server" vs "server rejected request with specific error code". Users handle these differently.

10. **Map external error codes to enums** - If the API being wrapped has error codes, map them to a Rust enum. Include a catch-all variant with the raw code for unknown errors.

## Boilerplate Reduction

11. **Use procedural macros for repetitive patterns** - If writing similar code for many endpoints (request building, response parsing), create a derive macro. The upfront investment pays off in consistency and reduced bugs.

12. **Use builder pattern for complex construction** - Use `bon`, `typed-builder`, or similar for structs with many optional fields. Provides good IDE completion and clear API.

13. **Separate macro crates from main crate** - Procedural macros must be in their own crate. Keep parsing (`darling`) separate from code generation for maintainability.

## Pagination & Streaming

14. **Provide multiple abstraction levels for collections** - Offer:
    - `.send()` - Collect all results (simple but memory-heavy)
    - `.stream()` - Stream individual items (memory-efficient)
    - `.stream_pages()` - Stream pages with metadata (full control)

15. **Use `futures::Stream` for lazy evaluation** - Don't fetch all pages upfront. Let consumers pull data as needed.

## Resilience

16. **Implement retry with exponential backoff** - Handle transient failures gracefully. Respect server-provided retry hints (e.g., `Retry-After`, rate limit headers).

17. **Cache tokens and refresh proactively** - Don't fetch new tokens for every request. Cache them and refresh before expiry.

18. **Extract and expose rate limit info** - Parse rate limit headers and expose them to callers so they can make informed decisions about request pacing.

## Observability

19. **Add distributed tracing to key operations** - Use `tracing` or `fastrace` to instrument request lifecycle. Include method, path, status code, and any retry attempts.

20. **Preserve external request IDs** - If the service returns request IDs, extract and include them in errors and logs for correlation during debugging.

## Feature Flags

21. **Make heavy dependencies optional** - Crypto libraries, cloud SDKs, and similar should be behind feature flags. Provide sensible defaults.

22. **Use `full` feature for convenience** - Let users opt into everything with a single feature when they don't care about binary size.

23. **Gate test utilities behind a feature** - Expose mock helpers and test utilities under a `test-helpers` feature so users can use them in their tests.

## Documentation

24. **Enforce documentation with `#![deny(missing_docs)]`** - Every public item should have a doc comment. This lint makes it a compile error to forget.

25. **Include runnable examples in docs** - Use `/// # Examples` sections with code that compiles and runs via `cargo test --doc`.

26. **Structure docs by user need** - Organize into tutorials (learning), how-to guides (tasks), explanations (understanding), and reference (lookup).

## Testing

27. **Use HTTP mocking for integration tests** - Use `wiremock` or `httpmock` to test against mock servers. Test both success paths and error responses.

28. **Test macros with `trybuild`** - For procedural macros, use compile-pass and compile-fail tests to verify both valid usage and helpful error messages.

29. **Create test helper functions** - Centralize test data generation (`generate_test_user()`) to keep tests focused on behavior, not setup.

## API Design

30. **Accept `impl Into<T>` for flexibility** - Let users pass `&str` or `String` where appropriate. Reduces friction without sacrificing type safety.

31. **Return `impl Trait` for complex return types** - Hide implementation details of iterators and futures behind `impl Iterator` or `impl Future`.

32. **Use `Cow<'static, str>` for mixed ownership** - When strings might be static or owned, `Cow` avoids unnecessary allocations.
