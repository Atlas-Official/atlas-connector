import { LogCollector } from "./logCollector";
import { getAttributeOrThrow } from "./helpers";

const script = document.currentScript as HTMLScriptElement | null;

const clientToken = getAttributeOrThrow(script, "data-client-token");
const dataDomain = getAttributeOrThrow(script, "data-domain");

const collector = new LogCollector({
  endpoint: dataDomain,
  clientToken,
});

(window as any).LogCollector = collector;

collector.init();
