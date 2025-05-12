# Log Collector

```php
<script
  src="https://your-cdn.com/path/to/logCollector.js"
  data-endpoint="https://your-api.com/logs"
  data-user-id="<?php echo $userId; ?>"
></script>
```

### Configuration Options

- `data-endpoint`: The URL to send logs to (required)
- `data-user-id`: Optional user ID for tracking
- `data-flush-interval`: Interval in milliseconds to send batched logs (default: 5000)
- `data-auto-init`: Set to "false" to disable automatic initialization

### Manual Initialization

If you set `data-auto-init="false"`, you can manually initialize the collector:

```html
<script>
  document.addEventListener("DOMContentLoaded", function () {
    window.LogCollector.init();
  });
</script>
```

### Tracking Custom Events

```html
<script>
  // Track a user action
  window.LogCollector.trackEvent("add_to_cart", {
    productId: "123",
    price: 99.99,
    quantity: 1,
  });

  // Set or update user ID
  window.LogCollector.setUserId("user-123");
</script>
```

## Backend Implementation

```json
{
  "events": [
    {
      "type": "pageview",
      "timestamp": 1631234567890,
      "url": "https://example.com/page",
      "path": "/page",
      "sessionId": "123456-abcdef",
      "userId": "user-123",
      "metadata": {
        "title": "Page Title",
        "referrer": "https://example.com"
      }
    }
  ],
  "sessionId": "123456-abcdef",
  "timestamp": 1631234567890,
  "userAgent": "Mozilla/5.0 ..."
}
```
