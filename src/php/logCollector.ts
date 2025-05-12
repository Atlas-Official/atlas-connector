/**
 * LogCollector - A utility for tracking user interactions and sending them to a server
 */

interface LogEvent {
  type: string;
  target?: string;
  timestamp: number;
  url: string;
  path: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class LogCollector {
  private endpoint: string;
  private sessionId: string;
  private userId: string | null;
  private buffer: LogEvent[] = [];
  private flushInterval: number;
  private flushIntervalId: number | null = null;
  private initialized: boolean = false;

  constructor(options: {
    endpoint: string;
    flushInterval?: number;
    userId?: string;
  }) {
    this.endpoint = options.endpoint;
    this.flushInterval = options.flushInterval || 5000; // Default to 5 seconds
    this.userId = options.userId || null;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize the log collector and attach event listeners
   */
  public init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Track page loads and transitions
    window.addEventListener("load", () => this.trackPageView());
    window.addEventListener("popstate", () => this.trackPageView());

    // Capture all clicks using event delegation
    document.addEventListener("click", (event) => this.handleClick(event));

    // Track form submissions
    document.addEventListener("submit", (event) =>
      this.handleFormSubmit(event)
    );

    // Setup periodic flush of logs
    this.flushIntervalId = window.setInterval(
      () => this.flush(),
      this.flushInterval
    );

    // Flush before page unload
    window.addEventListener("beforeunload", () => this.flush());

    // Track initial page view
    this.trackPageView();
  }

  /**
   * Set or update the user ID
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Track a custom event
   */
  public trackEvent(eventType: string, metadata?: Record<string, any>): void {
    this.addToBuffer({
      type: eventType,
      timestamp: Date.now(),
      url: window.location.href,
      path: window.location.pathname,
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      metadata,
    });
  }

  /**
   * Track a page view
   */
  private trackPageView(): void {
    this.addToBuffer({
      type: "pageview",
      timestamp: Date.now(),
      url: window.location.href,
      path: window.location.pathname,
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      metadata: {
        title: document.title,
        referrer: document.referrer,
      },
    });
  }

  /**
   * Handle click events and track button/link clicks
   */
  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Check if click is on a button or link
    let element = target;
    let trackElement: HTMLElement | null = null;

    // Traverse up to find closest button or link
    while (element && element !== document.body) {
      if (
        element.tagName === "BUTTON" ||
        element.tagName === "A" ||
        element.hasAttribute("data-track-click")
      ) {
        trackElement = element;
        break;
      }
      element = element.parentElement as HTMLElement;
    }

    if (!trackElement) return;

    // Get element information
    const elementType = trackElement.tagName.toLowerCase();
    const elementId = trackElement.id || undefined;
    const elementText = trackElement.textContent?.trim() || undefined;
    const elementClasses = trackElement.className || undefined;
    const href = trackElement.getAttribute("href") || undefined;
    const dataAttributes: Record<string, string> = {};

    // Collect data attributes
    Array.from(trackElement.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-")) {
        dataAttributes[attr.name] = attr.value;
      }
    });

    this.addToBuffer({
      type: "click",
      target: elementType,
      timestamp: Date.now(),
      url: window.location.href,
      path: window.location.pathname,
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      metadata: {
        elementId,
        elementText,
        elementClasses,
        href,
        ...dataAttributes,
      },
    });
  }

  /**
   * Handle form submission events
   */
  private handleFormSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    if (!form || form.tagName !== "FORM") return;

    this.addToBuffer({
      type: "form_submit",
      target: "form",
      timestamp: Date.now(),
      url: window.location.href,
      path: window.location.pathname,
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      metadata: {
        formId: form.id || undefined,
        formAction: form.action || undefined,
        formMethod: form.method || "get",
      },
    });
  }

  /**
   * Add an event to the buffer
   */
  private addToBuffer(event: LogEvent): void {
    this.buffer.push(event);

    // If buffer exceeds 20 items, flush it
    if (this.buffer.length >= 20) {
      this.flush();
    }
  }

  /**
   * Flush the buffer by sending events to the server
   */
  private flush(): void {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        events,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }),
      // Use keepalive to ensure the request completes even if the page is unloading
      keepalive: true,
    }).catch((error) => {
      console.error("Failed to send logs:", error);
      // Add the events back to the buffer if the request fails
      this.buffer = [...events, ...this.buffer];
    });
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
  }

  /**
   * Clean up resources when the collector is no longer needed
   */
  public destroy(): void {
    if (this.flushIntervalId !== null) {
      window.clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }

    // Flush any remaining events
    this.flush();
    this.initialized = false;
  }
}

// Create a global instance with auto-initialization
(function () {
  const script = document.currentScript as HTMLScriptElement;

  if (script) {
    const endpoint = script.getAttribute("data-endpoint") || "/api/logs";
    const flushInterval = script.getAttribute("data-flush-interval")
      ? parseInt(script.getAttribute("data-flush-interval") as string, 10)
      : undefined;
    const userId = script.getAttribute("data-user-id") || undefined;

    const collector = new LogCollector({
      endpoint,
      flushInterval,
      userId: userId || undefined,
    });

    // Make the collector globally accessible
    (window as any).LogCollector = collector;

    // Auto-initialize if not disabled
    if (script.getAttribute("data-auto-init") !== "false") {
      collector.init();
    }
  }
})();
