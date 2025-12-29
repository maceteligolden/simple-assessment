# Performance Optimizations

This document details the strategies used to keep the system fast and responsive.

## 1. Database Performance
1. **Indexing**: Compound indexes on frequently queried fields (e.g., `{ examId: 1, userId: 1 }`).
2. **Projections**: Using `.select()` to only fetch required fields, reducing memory and network overhead.
3. **Lean Queries**: Using `.lean()` for read-only operations to bypass Mongoose document overhead.
4. **Aggregation**: Using MongoDB aggregation pipelines for efficient counting and scoring.

## 2. Caching
- **Modular Cache**: In-memory caching using `node-cache`.
- **Invalidation**: Specific invalidation rules per module (e.g., updating an exam clears its specific cache and the examiner's list cache).
- **TTL**: Configurable time-to-live for different data types.

## 3. Scalability
- **N+1 Fixes**: Replaced loops containing individual database queries with batch `$in` queries.
- **Connection Pooling**: Optimized MongoDB connection settings for write-heavy workloads.
- **Compression**: Enabled `gzip` compression and MongoDB `zlib` compression for reduced data transfer.

