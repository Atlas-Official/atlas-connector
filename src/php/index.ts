import { LogCollector } from "./LogCollector";

const script = document.currentScript as HTMLScriptElement | null;

const endpoint = script?.getAttribute("data-endpoint") || "/api/logs";
const flushInterval = script?.hasAttribute("data-flush-interval")
  ? parseInt(script.getAttribute("data-flush-interval")!, 10)
  : undefined;
const userId = script?.getAttribute("data-user-id") || undefined;

const collector = new LogCollector({
  endpoint,
  flushInterval,
  userId,
});

(window as any).LogCollector = collector;

if (script?.getAttribute("data-auto-init") !== "false") {
  collector.init();
}
