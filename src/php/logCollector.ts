import { DataType, PostRequest, PostRequestType, Data, Convert } from "./types";
import { generateFingerprint, getOrCreateSessionId } from "./session";
import { attachEventHandlers } from "./eventHandlers";
import { generateUUID } from "./helpers";

interface LogCollectorOptions {
  endpoint?: string;
  clientToken?: string;
}

export class LogCollector {
  private endpoint: string;
  private clientToken: string;
  private sessionId: string;
  private initialized: boolean = false;
  private viewStartTime: number = 0;
  private currentPath: string = "";
  private currentUrl: string = "";
  private sessionStartTime: number = Date.now();
  private viewCount: number = 0;
  private actionCount: number = 0;
  private willSendSessionStart: boolean = true;

  constructor(options: LogCollectorOptions = {}) {
    this.endpoint = options.endpoint || "/api/logs";
    this.clientToken = options.clientToken || "";
    this.willSendSessionStart =
      window.sessionStorage.getItem("log_session_id") === null;
    this.sessionId = getOrCreateSessionId();
  }

  public init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Send initial session start event
    if (this.willSendSessionStart) {
      this.trackSessionStart();
    }

    // Setup event handlers
    attachEventHandlers(this);

    // Track initial page view
    this.trackPageViewStart();

    // Setup handlers for tab/browser close
    window.addEventListener("beforeunload", () => {
      this.trackPageViewEnd();
      this.trackSessionEnd();
    });

    // Setup navigation handlers
    window.addEventListener("popstate", () => {
      this.trackPageViewEnd();
      this.trackPageViewStart();
    });
  }

  private async sendRequest(
    requestType: PostRequestType,
    data: Data
  ): Promise<void> {
    const request: PostRequest = {
      type: requestType,
      data: data,
    };

    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Token": this.clientToken,
        },
        body: Convert.postRequestToJson(request),
        keepalive: true,
      });
    } catch (error) {
      console.error("Failed to send log event:", error);
    }
  }

  private trackSessionStart(): void {
    const data: Data = {
      id: this.sessionId,
      fingerprint: generateFingerprint(),
      isActive: true,
      referrer: document.referrer || undefined,
      timestamp: this.sessionStartTime,
      type: DataType.User,
      userAgent: "", // Will be filled server-side
      userOrigin: "", // Will be filled server-side
    };

    this.sendRequest(PostRequestType.SessionStart, data);
  }

  private trackSessionEnd(): void {
    const timeSpent = Date.now() - this.sessionStartTime;

    const data: Data = {
      id: this.sessionId,
      fingerprint: generateFingerprint(),
      isActive: false,
      referrer: document.referrer || undefined,
      timestamp: this.sessionStartTime,
      type: DataType.User,
      actionCount: this.actionCount,
      timeSpent: timeSpent,
      viewCount: this.viewCount,
      userAgent: "", // Will be filled server-side
      userOrigin: "", // Will be filled server-side
    };

    this.sendRequest(PostRequestType.SessionEnd, data);
  }

  public trackPageViewStart(): void {
    this.viewStartTime = Date.now();
    this.currentPath = window.location.pathname;
    this.currentUrl = window.location.href;
    this.viewCount++;

    const data: Data = {
      id: generateUUID(),
      path: this.currentPath,
      sessionId: this.sessionId,
      timestamp: this.viewStartTime,
      url: this.currentUrl,
      title: document.title || undefined,
      referrer: document.referrer || undefined,
      userAgent: "", // Will be filled server-side
      userOrigin: "", // Will be filled server-side
    };

    this.sendRequest(PostRequestType.ViewStart, data);
  }

  public trackPageViewEnd(): void {
    if (this.viewStartTime === 0) return;

    const timeSpent = Date.now() - this.viewStartTime;

    const data: Data = {
      id: generateUUID(),
      path: this.currentPath,
      sessionId: this.sessionId,
      timeSpent: timeSpent,
      timestamp: Date.now(),
      url: this.currentUrl,
      title: document.title || undefined,
      referrer: document.referrer || undefined,
      userAgent: "", // Will be filled server-side
      userOrigin: "", // Will be filled server-side
    };

    this.sendRequest(PostRequestType.ViewEnd, data);
  }

  public handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    this.actionCount++;

    const data: Data = {
      id: generateUUID(),
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: DataType.Click,
      target: target.id || target.tagName || undefined,
      userAgent: "", // Will be filled server-side
      userOrigin: "", // Will be filled server-side
    };

    this.sendRequest(PostRequestType.Action, data);
  }

  public handleFormSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    this.actionCount++;

    const data: Data = {
      id: generateUUID(),
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: DataType.FormSubmit,
      target: form.id || form.name || "unnamed_form",
      userAgent: "", // Will be filled server-side
      userOrigin: "", // Will be filled server-side
    };

    this.sendRequest(PostRequestType.Action, data);
  }

  public destroy(): void {
    // Track end events before destroying
    this.trackPageViewEnd();
    this.trackSessionEnd();
  }
}
