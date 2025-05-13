import {
  ActionEvent,
  ActionEventType,
  FetchEvent,
  FetchEventType,
  SessionAttributes,
  SessionAttributesType,
  SessionEvent,
  SessionMetrics,
  ViewEvent,
} from "./types";
import { getOrCreateSessionId } from "./session";
import { attachEventHandlers } from "./eventHandlers";

interface LogCollectorOptions {
  endpoint?: string;
  flushInterval?: number;
  userId?: string;
}

export class LogCollector {
  private endpoint: string;
  private flushInterval: number;
  private userId?: string;
  private sessionId: string;
  private events: FetchEvent[] = [];
  private initialized: boolean = false;
  private flushIntervalId?: number;
  private viewStartTime: number = 0;
  private currentPath: string = "";
  private currentUrl: string = "";
  private sessionStartTime: number = Date.now();
  private viewCount: number = 0;
  private actionCount: number = 0;

  constructor(options: LogCollectorOptions = {}) {
    this.endpoint = options.endpoint || "/api/logs";
    this.flushInterval = options.flushInterval || 30000;
    this.userId = options.userId;
    this.sessionId = getOrCreateSessionId();
  }

  public init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Setup periodic flush of logs
    this.flushIntervalId = window.setInterval(
      () => this.flush(),
      this.flushInterval
    );

    // Send initial session start event
    this.trackSessionStart();

    // Setup event handlers
    attachEventHandlers(this);

    // Track initial page view
    this.trackPageViewStart();

    // Setup handlers for tab/browser close
    window.addEventListener("beforeunload", () => {
      this.trackPageViewEnd();
      this.trackSessionEnd();
      this.flush();
    });

    // Setup navigation handlers
    window.addEventListener("popstate", () => {
      this.trackPageViewEnd();
      this.trackPageViewStart();
    });
  }

  private trackSessionStart(): void {
    const sessionAttributes: SessionAttributes = {
      fingerprint: this.generateFingerprint(),
      ip: "", // Will be filled server-side
      isActive: true,
      referrer: document.referrer || undefined,
      type: SessionAttributesType.User,
    };

    const sessionMetrics: SessionMetrics = {
      actionCount: 0,
      timeSpent: 0,
      viewCount: 0,
    };

    const sessionEvent: SessionEvent = {
      attributes: sessionAttributes,
      id: this.sessionId,
      metrics: sessionMetrics,
      startTimestamp: this.sessionStartTime,
    };

    const fetchEvent: FetchEvent = {
      type: FetchEventType.Session,
      data: sessionEvent,
    };

    this.events.push(fetchEvent);
  }

  private trackSessionEnd(): void {
    const timeSpent = Date.now() - this.sessionStartTime;

    const sessionAttributes: SessionAttributes = {
      fingerprint: this.generateFingerprint(),
      ip: "", // Will be filled server-side
      isActive: false,
      referrer: document.referrer || undefined,
      type: SessionAttributesType.User,
    };

    const sessionMetrics: SessionMetrics = {
      actionCount: this.actionCount,
      timeSpent: timeSpent,
      viewCount: this.viewCount,
    };

    const sessionEvent: SessionEvent = {
      attributes: sessionAttributes,
      id: this.sessionId,
      metrics: sessionMetrics,
      startTimestamp: this.sessionStartTime,
      endTimestamp: Date.now(),
    };

    const fetchEvent: FetchEvent = {
      type: FetchEventType.Session,
      data: sessionEvent,
    };

    this.events.push(fetchEvent);
  }

  public trackPageViewStart(): void {
    this.viewStartTime = Date.now();
    this.currentPath = window.location.pathname;
    this.currentUrl = window.location.href;
    this.viewCount++;

    const viewEvent: ViewEvent = {
      path: this.currentPath,
      sessionId: this.sessionId,
      timeSpent: 0,
      timestamp: this.viewStartTime,
      url: this.currentUrl,
      title: document.title || undefined,
      referrer: document.referrer || undefined,
    };

    const fetchEvent: FetchEvent = {
      type: FetchEventType.View,
      data: viewEvent,
    };

    this.events.push(fetchEvent);
  }

  public trackPageViewEnd(): void {
    if (this.viewStartTime === 0) return;

    const timeSpent = Date.now() - this.viewStartTime;

    const viewEvent: ViewEvent = {
      path: this.currentPath,
      sessionId: this.sessionId,
      timeSpent: timeSpent,
      timestamp: Date.now(),
      url: this.currentUrl,
      title: document.title || undefined,
      referrer: document.referrer || undefined,
    };

    const fetchEvent: FetchEvent = {
      type: FetchEventType.View,
      data: viewEvent,
    };

    this.events.push(fetchEvent);
  }

  public handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    this.actionCount++;

    const actionEvent: ActionEvent = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: ActionEventType.Click,
      target: target.id || target.tagName || undefined,
    };

    const fetchEvent: FetchEvent = {
      type: FetchEventType.Action,
      data: actionEvent,
    };

    this.events.push(fetchEvent);
  }

  public handleFormSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    this.actionCount++;

    const actionEvent: ActionEvent = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: ActionEventType.FormSubmit,
      target: form.id || form.name || "unnamed_form",
    };

    const fetchEvent: FetchEvent = {
      type: FetchEventType.Action,
      data: actionEvent,
    };

    this.events.push(fetchEvent);
  }

  public flush(): void {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventsToSend),
      keepalive: true,
    }).catch((error) => {
      console.error("Failed to send logs:", error);
      // Add back failed events to retry later
      this.events = [...eventsToSend, ...this.events];
    });
  }

  public destroy(): void {
    if (this.flushIntervalId) {
      window.clearInterval(this.flushIntervalId);
    }

    // Track end events before destroying
    this.trackPageViewEnd();
    this.trackSessionEnd();

    // Flush any remaining events
    this.flush();
  }

  private generateFingerprint(): string {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      // platform: navigator.platform, // Deprecated, do not use
      hardwareConcurrency: (navigator as any).hardwareConcurrency || "unknown",
      deviceMemory: (navigator as any).deviceMemory || "unknown",
    };

    function hashObject(obj: Record<string, any>): string {
      const str = Object.entries(obj)
        .map(([k, v]) => `${k}:${v}`)
        .join("|");
      let hash = 0,
        i,
        chr;
      for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
      }
      // Convert hash to base36 and pad
      return Math.abs(hash).toString(36).padStart(10, "0").slice(0, 32);
    }

    return hashObject(fingerprint);
  }
}
