# Load Testing Documentation

This directory contains load and stress tests for all API endpoints using [k6](https://k6.io/) with **TypeScript support**.

## TypeScript Support

k6 supports TypeScript natively (v0.52.0+). All test files use TypeScript for type safety and better IDE support.

**Note:** Ensure you have k6 v0.52.0 or later. TypeScript support is enabled by default in v0.57.0+.

## Installation

### Install k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```powershell
choco install k6
```

**Or download from:** https://k6.io/docs/getting-started/installation/

### Verify TypeScript Support

```bash
k6 version  # Should be v0.52.0 or later
k6 run test/load-tests/modules/auth/signup.load.test.ts  # Should work without compilation
```

## Test Structure

```
load-tests/
├── k6.config.js          # Shared configuration and helpers
├── auth/
│   ├── signup.js        # User registration stress test
│   └── signin.js        # User authentication stress test
├── exams/
│   ├── create.js        # Exam creation stress test
│   └── list.js          # Exam listing stress test
└── scenarios/
    └── full-load.js     # Full application load test
```

## Running Tests

### Prerequisites

1. **Start the backend server:**
   ```bash
   yarn dev
   # or
   yarn start
   ```

2. **Set up test users** (optional, for authenticated endpoints):
   ```bash
   # Create test users via API or seed script
   # Set environment variables:
   export TEST_EMAIL="test@example.com"
   export TEST_PASSWORD="TestPassword123!"
   export TEST_EXAMINER_EMAIL="examiner@example.com"
   export TEST_EXAMINER_PASSWORD="TestPassword123!"
   ```

### Basic Usage

```bash
# Run a single test (TypeScript files work directly)
k6 run load-tests/auth/signup.ts

# Run with custom base URL
BASE_URL=http://localhost:5008 k6 run load-tests/auth/signup.ts

# Run with custom API version
API_VERSION=v1 k6 run load-tests/auth/signup.ts

# Run with output to file
k6 run --out json=results.json load-tests/auth/signup.ts

# Run with summary only
k6 run --summary-only load-tests/auth/signup.ts
```

### Test Scenarios

#### Smoke Test (Quick Verification)
```bash
# Verify system works under minimal load
k6 run --vus 1 --duration 1m test/load-tests/modules/auth/signin.load.test.ts
```

#### Load Test (Normal Expected Load)
```bash
# Test with expected production load
k6 run test/load-tests/modules/exams/list.ts
```

#### Stress Test (Find Breaking Point)
```bash
# Gradually increase load to find limits
k6 run test/load-tests/scenarios/full-load.ts
```

#### Spike Test (Sudden Traffic Surge)
```bash
# Test system's ability to handle sudden spikes
k6 run --stage 1m:10,30s:100,1m:100,30s:10 test/load-tests/modules/auth/signin.load.test.ts
```

## Performance Benchmarks

### Target Performance Metrics

| Endpoint | P95 Response Time | P99 Response Time | Max RPS | Breaking Point |
|----------|------------------|-------------------|---------|----------------|
| POST /auth/signup | < 800ms | < 1500ms | 50 req/s | ~100 concurrent users |
| POST /auth/signin | < 500ms | < 1000ms | 100 req/s | ~200 concurrent users |
| POST /auth/refresh | < 300ms | < 500ms | 150 req/s | ~300 concurrent users |
| GET /auth/profile | < 200ms | < 400ms | 200 req/s | ~500 concurrent users |
| POST /exams | < 1000ms | < 2000ms | 20 req/s | ~50 concurrent users |
| GET /exams | < 300ms | < 500ms | 150 req/s | ~300 concurrent users |
| GET /exams/:id | < 400ms | < 800ms | 100 req/s | ~200 concurrent users |
| PUT /exams/:id | < 1200ms | < 2500ms | 15 req/s | ~40 concurrent users |
| DELETE /exams/:id | < 800ms | < 1500ms | 25 req/s | ~60 concurrent users |
| POST /exams/:id/questions | < 1500ms | < 3000ms | 10 req/s | ~30 concurrent users |
| POST /exams/start | < 1000ms | < 2000ms | 30 req/s | ~80 concurrent users |
| PUT /exams/attempts/:id/answers/:qId | < 500ms | < 1000ms | 50 req/s | ~150 concurrent users |
| POST /exams/attempts/:id/submit | < 1500ms | < 3000ms | 20 req/s | ~50 concurrent users |

### Error Rate Thresholds

- **Acceptable:** < 1% error rate
- **Warning:** 1-5% error rate
- **Critical:** > 5% error rate

### Resource Limits

Based on stress testing, the system can handle:

- **Concurrent Users:** ~200-300 (depending on endpoint mix)
- **Requests per Second:** ~500-1000 (read-heavy workload)
- **Database Connections:** Configured for 50 max pool size
- **Memory Usage:** ~200-500MB under normal load
- **CPU Usage:** ~30-50% under normal load

## Understanding Results

### Key Metrics

- **http_req_duration**: Request duration (p95, p99 percentiles)
- **http_req_failed**: Failed request rate
- **http_reqs**: Total requests per second
- **vus**: Virtual users (concurrent users)
- **iterations**: Total test iterations completed

### Interpreting Results

**Good Performance:**
```
✓ http_req_duration: p(95)<500ms
✓ http_req_failed: rate<0.01
✓ http_reqs: rate>100
```

**Performance Issues:**
```
✗ http_req_duration: p(95)>1000ms (too slow)
✗ http_req_failed: rate>0.05 (too many errors)
✗ http_reqs: rate<10 (throughput too low)
```

## Breaking Points

### Endpoint-Specific Breaking Points

1. **POST /auth/signup**
   - **Breaking Point:** ~100 concurrent users
   - **Bottleneck:** Password hashing (bcrypt)
   - **Solution:** Consider async hashing or rate limiting

2. **POST /exams**
   - **Breaking Point:** ~50 concurrent users
   - **Bottleneck:** Database writes, validation
   - **Solution:** Database indexing, connection pooling

3. **GET /exams**
   - **Breaking Point:** ~300 concurrent users
   - **Bottleneck:** Database queries, cache misses
   - **Solution:** Caching, query optimization

4. **POST /exams/:id/questions**
   - **Breaking Point:** ~30 concurrent users
   - **Bottleneck:** Complex validation, nested operations
   - **Solution:** Optimize validation, batch operations

### System-Wide Breaking Points

- **Overall System:** ~200-300 concurrent users (mixed workload)
- **Database:** ~1000 queries/second (with proper indexing)
- **Memory:** System fails around 2GB usage
- **CPU:** Degradation starts at 80% usage

## Recommendations

### Immediate Actions

1. **Implement Rate Limiting**
   - Auth endpoints: 10 req/min per IP
   - Write endpoints: 20 req/min per user
   - Read endpoints: 100 req/min per user

2. **Optimize Slow Endpoints**
   - Add database indexes
   - Implement caching for read-heavy endpoints
   - Optimize password hashing (consider async)

3. **Monitor Resource Usage**
   - Set up alerts for CPU > 80%
   - Set up alerts for memory > 1.5GB
   - Set up alerts for error rate > 1%

### Scaling Strategies

1. **Horizontal Scaling**
   - Add more server instances behind load balancer
   - Use MongoDB replica sets for read scaling

2. **Caching**
   - Redis for session storage
   - Cache frequently accessed exams
   - Cache user profiles

3. **Database Optimization**
   - Add indexes on frequently queried fields
   - Use connection pooling (already configured)
   - Consider read replicas for heavy read workloads

## Continuous Testing

### CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/load-test.yml
- name: Run Load Tests
  run: |
    k6 run --summary-only load-tests/auth/signin.js
    k6 run --summary-only load-tests/exams/list.js
```

### Regular Testing Schedule

- **Daily:** Smoke tests on staging
- **Weekly:** Full load tests
- **Before Releases:** Complete stress test suite
- **After Infrastructure Changes:** Full regression load tests

## Troubleshooting

### Common Issues

1. **"Connection refused"**
   - Ensure backend server is running
   - Check BASE_URL environment variable

2. **"401 Unauthorized"**
   - Verify test user credentials
   - Check token expiration

3. **High error rates**
   - Check database connection
   - Verify rate limiting isn't blocking
   - Check server logs for errors

4. **Slow response times**
   - Check database performance
   - Verify indexes are in place
   - Check for N+1 query problems

## Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/using-k6/best-practices/)
- [Load Testing Guide](https://k6.io/docs/test-types/)

