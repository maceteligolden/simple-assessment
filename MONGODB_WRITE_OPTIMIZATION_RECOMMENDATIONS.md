# MongoDB Connection Configuration Recommendations
## For Write-Heavy Applications

## Current Configuration Analysis

Your current configuration:
```typescript
{
  maxPoolSize: 10,           // Too low for write-heavy workloads
  minPoolSize: 2,            // Reasonable
  socketTimeoutMS: 45000,    // Good
  serverSelectionTimeoutMS: 3000, // Good
  retryWrites: true,         // Good
  retryReads: true,          // Good
  connectTimeoutMS: 3000,    // Good
}
```

## 🚀 Recommended Configuration for Write-Heavy Applications

### 1. **Connection Pool Settings** (CRITICAL)

```typescript
{
  // INCREASE pool size for write-heavy workloads
  maxPoolSize: 50,              // Increase from 10 to 50 (or higher based on load)
  minPoolSize: 10,              // Increase from 2 to 10 (maintain warm connections)
  
  // Connection lifecycle
  maxIdleTimeMS: 30000,         // Close idle connections after 30s (default is 0 = never)
  waitQueueTimeoutMS: 10000,    // Max time to wait for connection from pool (default: 0 = infinite)
}
```

**Why:**
- Write operations hold connections longer than reads
- Higher pool size prevents connection starvation
- Warm connections reduce latency
- `maxIdleTimeMS` prevents connection bloat

---

### 2. **Write Concern Settings** (CRITICAL for Data Integrity)

```typescript
{
  // Write concern - balance between performance and durability
  w: 1,                         // Acknowledge write after 1 node (fastest, default)
  // OR for better durability:
  // w: 'majority',              // Wait for majority of replica set (slower but safer)
  
  wtimeout: 5000,               // Timeout for write concern (5 seconds)
  j: false,                     // Don't wait for journal flush (faster, less safe)
  // OR for better durability:
  // j: true,                    // Wait for journal flush (slower but safer)
}
```

**Recommendation for your app:**
- Use `w: 1, j: false` for **answer submissions** (speed critical, can recover)
- Use `w: 'majority', j: true` for **exam creation, participant addition** (data integrity critical)

**Per-operation write concern:**
```typescript
// Fast writes (answer submissions)
await Attempt.updateOne(
  { _id: attemptId },
  { $set: { answers: newAnswers } },
  { w: 1, j: false }  // Fast, acceptable risk
)

// Critical writes (exam creation)
await Exam.create(examData, { w: 'majority', j: true })  // Safe, slower
```

---

### 3. **Buffer Settings** (IMPORTANT)

```typescript
{
  bufferMaxEntries: 0,          // Disable mongoose buffering (fail fast on disconnect)
  bufferCommands: false,        // Don't buffer commands when disconnected
}
```

**Why:**
- Prevents command queue buildup during disconnects
- Fails fast instead of silently queuing
- Better error handling

---

### 4. **Compression** (PERFORMANCE)

```typescript
{
  compressors: ['zlib'],         // Enable compression (reduces network traffic)
  zlibCompressionLevel: 6,      // Balance between CPU and compression (1-9, default: 6)
}
```

**Why:**
- Reduces network bandwidth (important for answer submissions)
- Slightly increases CPU usage but saves network I/O
- Especially beneficial for large documents

---

### 5. **Heartbeat & Monitoring** (RELIABILITY)

```typescript
{
  heartbeatFrequencyMS: 10000,  // Check server status every 10s (default: 10s)
  serverSelectionTimeoutMS: 5000, // Increase from 3s to 5s for better reliability
  socketTimeoutMS: 45000,       // Keep current (45s is good)
  connectTimeoutMS: 10000,      // Increase from 3s to 10s for slow networks
}
```

**Why:**
- Faster failure detection
- Better handling of network latency
- Prevents premature timeouts

---

### 6. **Read Preference** (For Replica Sets)

```typescript
{
  readPreference: 'primary',     // Always read from primary (default, good for consistency)
  // OR for read scaling:
  // readPreference: 'secondaryPreferred', // Read from secondary if available
}
```

**For your app:** Keep `primary` since you need strong consistency for exam data.

---

### 7. **Retry Settings** (RELIABILITY)

```typescript
{
  retryWrites: true,            // ✅ Already enabled - good!
  retryReads: true,             // ✅ Already enabled - good!
  maxStalenessSeconds: 90,      // For replica sets: max acceptable staleness
}
```

**Why:**
- Automatic retry on transient failures
- Reduces application-level retry logic
- Better resilience

---

### 8. **Additional Optimizations**

#### A. **Direct Connection** (If using single MongoDB instance)
```typescript
{
  directConnection: false,       // Use connection string format (default)
  // For single instance without replica set:
  // directConnection: true,     // Bypass replica set discovery
}
```

#### B. **Server Selection**
```typescript
{
  serverSelectionTimeoutMS: 5000,
  localThresholdMS: 15,         // Prefer servers within 15ms (default: 15ms)
}
```

#### C. **Connection String Options**
Add to MongoDB URI:
```
mongodb://host:port/db?maxPoolSize=50&minPoolSize=10&w=1&retryWrites=true&compressors=zlib
```

---

## 📊 Recommended Complete Configuration

```typescript
const connectionOptions: mongoose.ConnectOptions = {
  // Connection Pool (CRITICAL for write-heavy)
  maxPoolSize: 50,              // Increased from 10
  minPoolSize: 10,              // Increased from 2
  maxIdleTimeMS: 30000,         // Close idle connections
  
  // Timeouts
  connectTimeoutMS: 10000,       // Increased from 3000
  socketTimeoutMS: 45000,        // Keep current
  serverSelectionTimeoutMS: 5000, // Increased from 3000
  waitQueueTimeoutMS: 10000,    // Max wait for connection from pool
  
  // Write Concern (CRITICAL)
  w: 1,                          // Acknowledge after 1 node (fast)
  wtimeout: 5000,                // 5 second timeout
  j: false,                      // Don't wait for journal (fast)
  
  // Retry Settings
  retryWrites: true,             // ✅ Already enabled
  retryReads: true,              // ✅ Already enabled
  
  // Buffer Settings
  bufferMaxEntries: 0,           // Disable buffering
  bufferCommands: false,         // Fail fast on disconnect
  
  // Compression
  compressors: ['zlib'],          // Enable compression
  zlibCompressionLevel: 6,       // Balance CPU/compression
  
  // Heartbeat
  heartbeatFrequencyMS: 10000,   // Check server every 10s
  
  // Read Preference
  readPreference: 'primary',      // Always read from primary
}
```

---

## 🎯 Write-Specific Optimizations

### 1. **Use Bulk Operations**
Instead of multiple `.save()` calls:
```typescript
// ❌ BAD: Multiple individual writes
for (const question of questions) {
  await question.save()
}

// ✅ GOOD: Bulk write
await Question.bulkWrite(
  questions.map(q => ({
    updateOne: {
      filter: { _id: q._id },
      update: { $set: q },
    },
  }))
)
```

### 2. **Use `insertMany` with `ordered: false`**
```typescript
// ✅ GOOD: Parallel inserts
await Question.insertMany(questions, {
  ordered: false,  // Continue on error
  w: 1,            // Fast write concern
})
```

### 3. **Use `updateMany` for Batch Updates**
```typescript
// ✅ GOOD: Single operation
await Attempt.updateMany(
  { examId, status: 'in-progress' },
  { $set: { lastActivityAt: new Date() } },
  { w: 1, j: false }  // Fast write
)
```

### 4. **Disable Validation on Bulk Operations** (if safe)
```typescript
await Model.insertMany(documents, {
  ordered: false,
  runValidators: false,  // Skip validation for performance (use carefully!)
})
```

---

## 🔧 Environment-Specific Configurations

### Development
```typescript
{
  maxPoolSize: 10,
  minPoolSize: 2,
  w: 1,
  j: false,
}
```

### Production (Write-Heavy)
```typescript
{
  maxPoolSize: 50,        // Higher for production load
  minPoolSize: 10,        // Maintain warm connections
  w: 1,                   // Fast writes
  j: false,               // Speed over safety for non-critical data
  compressors: ['zlib'],  // Enable compression
}
```

### Production (Critical Data)
```typescript
{
  maxPoolSize: 50,
  minPoolSize: 10,
  w: 'majority',          // Wait for majority
  j: true,                // Journal flush (for exam creation, etc.)
  compressors: ['zlib'],
}
```

---

## 📈 Monitoring Recommendations

Add connection pool monitoring:
```typescript
mongoose.connection.on('connected', () => {
  const poolSize = mongoose.connection.db?.serverConfig?.poolSize
  logger.info('MongoDB connected', { poolSize })
})

// Monitor connection pool usage
setInterval(() => {
  const stats = mongoose.connection.db?.serverConfig?.poolSize
  logger.debug('Connection pool stats', stats)
}, 60000) // Every minute
```

---

## ⚠️ Important Considerations

1. **Pool Size vs Memory**: Each connection uses ~1MB RAM. 50 connections = ~50MB
2. **Write Concern Trade-offs**: 
   - `w: 1, j: false` = Fast but risk of data loss on crash
   - `w: 'majority', j: true` = Safe but slower
3. **Network Latency**: Compression helps but adds CPU overhead
4. **Replica Sets**: If using replica sets, consider read scaling for read-heavy operations

---

## 🎯 Priority Implementation Order

1. **Immediate**: Increase `maxPoolSize` to 50, add `maxIdleTimeMS`
2. **Short-term**: Add compression, adjust write concern per operation
3. **Long-term**: Implement bulk operations, add monitoring

---

## 📝 Example: Updated database.ts

```typescript
const connectionOptions: mongoose.ConnectOptions = {
  // Connection Pool (optimized for writes)
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '50', 10),
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '10', 10),
  maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000', 10),
  waitQueueTimeoutMS: parseInt(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS || '10000', 10),
  
  // Timeouts
  connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000', 10),
  socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000', 10),
  serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10),
  
  // Write Concern (default - can override per operation)
  w: (process.env.MONGODB_WRITE_CONCERN as '1' | 'majority') || '1',
  wtimeout: parseInt(process.env.MONGODB_WRITE_TIMEOUT_MS || '5000', 10),
  j: process.env.MONGODB_JOURNAL === 'true',
  
  // Retry
  retryWrites: true,
  retryReads: true,
  
  // Buffer
  bufferMaxEntries: 0,
  bufferCommands: false,
  
  // Compression
  compressors: process.env.MONGODB_COMPRESSION === 'false' ? [] : ['zlib'],
  zlibCompressionLevel: parseInt(process.env.MONGODB_ZLIB_LEVEL || '6', 10),
  
  // Heartbeat
  heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_MS || '10000', 10),
  
  // Read Preference
  readPreference: (process.env.MONGODB_READ_PREFERENCE as any) || 'primary',
}
```

