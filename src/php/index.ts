import { LogCollector } from "./LogCollector";
import { getAttributeOrThrow } from "./helpers";

const script = document.currentScript as HTMLScriptElement | null;

const clientToken = getAttributeOrThrow(script, "client-token");

const collector = new LogCollector({
  endpoint: `http://34.146.163.45`,
  clientToken,
});

(window as any).LogCollector = collector;

collector.init();
