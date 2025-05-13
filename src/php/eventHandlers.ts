import { LogCollector } from "./LogCollector";

export function attachEventHandlers(collector: LogCollector): void {
  document.addEventListener("click", (event) =>
    collector.handleClick(event as MouseEvent)
  );

  document.addEventListener("submit", (event) =>
    collector.handleFormSubmit(event)
  );
}
