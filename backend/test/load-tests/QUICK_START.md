# Quick Start Guide - Load Testing

## TypeScript Support

✅ **k6 supports TypeScript natively!** (v0.52.0+)

All test files use TypeScript for type safety. No compilation needed - k6 runs `.ts` files directly.

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

**Or download:** https://k6.io/docs/getting-started/installation/

### Verify Installation

```bash
k6 version  # Should be v0.52.0 or later for TypeScript support
```

## Quick Test

1. **Start your backend server:**
   ```bash
   yarn dev
   ```

2. **Run a quick smoke test:**
   ```bash
   yarn load:smoke
   ```

3. **Run a specific endpoint test:**
   ```bash
   # Authentication tests
   yarn load:auth:signup
   yarn load:auth:signin
   yarn load:auth:refresh
   yarn load:auth:profile
   yarn load:auth:signout
   yarn load:auth:search
   
   # Exam tests
   yarn load:exams:list
   yarn load:exams:create
   ```

4. **Run all tests:**
   ```bash
   yarn load:all
   ```

## Understanding Results

### Key Metrics to Watch

- **http_req_duration**: Response time (lower is better)
  - `p(95)<500` means 95% of requests complete in under 500ms
  - `p(99)<1000` means 99% of requests complete in under 1 second

- **http_req_failed**: Error rate (lower is better)
  - `rate<0.01` means less than 1% of requests fail

- **http_reqs**: Throughput (higher is better)
  - Shows requests per second

### Example Good Result

```
✓ http_req_duration: p(95)<500ms
✓ http_req_failed: rate<0.01
✓ http_reqs: rate>100
```

### Example Bad Result (Performance Issues)

```
✗ http_req_duration: p(95)>2000ms (too slow)
✗ http_req_failed: rate>0.05 (too many errors)
✗ http_reqs: rate<10 (low throughput)
```

## Test Scenarios

### Smoke Test (1 user, 1 minute)
```bash
yarn load:smoke
```
**Purpose:** Verify system works under minimal load

### Load Test (Normal production load)
```bash
yarn load:auth:signin
yarn load:exams:list
```
**Purpose:** Test with expected production traffic

### Stress Test (Find breaking point)
```bash
yarn load:full
```
**Purpose:** Gradually increase load to find system limits

## Custom Configuration

### Set Custom Base URL
```bash
BASE_URL=http://localhost:5008 yarn load:auth:signin
```

### Set Test User Credentials
```bash
TEST_EMAIL=test@example.com \
TEST_PASSWORD=password123 \
yarn load:auth:signin
```

### Set API Version
```bash
API_VERSION=v1 yarn load:exams:list
```

## Next Steps

1. Read `load-tests/README.md` for detailed documentation
2. Check `PERFORMANCE.md` for performance benchmarks
3. Customize test scenarios in `load-tests/` directory
4. Integrate into CI/CD pipeline

## Troubleshooting

**"k6: command not found"**
- Install k6 (see Installation above)

**"Connection refused"**
- Make sure backend server is running
- Check BASE_URL environment variable

**"401 Unauthorized"**
- Set TEST_EMAIL and TEST_PASSWORD environment variables
- Or create test users via API first

**High error rates**
- Check server logs
- Verify database is running
- Check rate limiting isn't blocking requests

