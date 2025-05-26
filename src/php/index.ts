import { LogCollector } from "./logCollector";
import { getAttributeOrThrow } from "./helpers";

const script = document.currentScript as HTMLScriptElement | null;

const clientToken = getAttributeOrThrow(script, "client-token");

const collector = new LogCollector({
  endpoint: `https://atlas-cloud-dev.com/logs`,
  clientToken,
});

(window as any).LogCollector = collector;

collector.init();
