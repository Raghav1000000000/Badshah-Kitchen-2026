/**
 * K6 Load Test: Menu Items Endpoint
 * Tests the menu loading with 100 concurrent users
 * 
 * Run with: k6 run menu-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users for 2 minutes
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],                  // Error rate should be below 5%
    errors: ['rate<0.05'],
  },
};

// Your Supabase configuration
const SUPABASE_URL = __ENV.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export default function () {
  // Simulate fetching menu items
  const params = {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  // Query menu items (is_available=true, ordered by category and name)
  const url = `${SUPABASE_URL}/rest/v1/menu_items?is_available=eq.true&order=category.asc,name.asc&select=*`;
  
  const response = http.get(url, params);

  // Validation checks
  const checkResult = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has menu items': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) && body.length > 0;
      } catch (e) {
        return false;
      }
    },
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Track errors
  errorRate.add(!checkResult);

  // Log failures
  if (response.status !== 200) {
    console.error(`Request failed: ${response.status} - ${response.body}`);
  }

  // Simulate user reading menu (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'menu-load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  
  let summary = '\n';
  summary += `${indent}Menu Load Test Summary:\n`;
  summary += `${indent}=======================\n`;
  
  if (data.metrics.checks) {
    const checks = data.metrics.checks.values;
    summary += `${indent}  Checks: ${checks.passes}/${checks.passes + checks.fails} passed (${((checks.passes / (checks.passes + checks.fails)) * 100).toFixed(2)}%)\n`;
  }
  
  if (data.metrics.http_reqs) {
    summary += `${indent}  Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  }
  
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.values) {
    const duration = data.metrics.http_req_duration.values;
    summary += `${indent}  Request Duration (avg): ${duration.avg ? duration.avg.toFixed(2) : 'N/A'}ms\n`;
    summary += `${indent}  Request Duration (p95): ${duration['p(95)'] ? duration['p(95)'].toFixed(2) : 'N/A'}ms\n`;
    summary += `${indent}  Request Duration (p99): ${duration['p(99)'] ? duration['p(99)'].toFixed(2) : 'N/A'}ms\n`;
  }
  
  if (data.metrics.http_req_failed) {
    summary += `${indent}  Failed Requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  }
  
  if (data.metrics.errors) {
    summary += `${indent}  Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  }
  
  return summary;
}
