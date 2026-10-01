/**
 * Safe performance monitoring wrapper.
 * Prevents "Cannot read properties of undefined (reading 'startTime')" errors
 * caused by third-party web-vitals libraries or browser PerformanceObserver anomalies.
 */

export function isSafePerformanceEntry(
  entry: unknown,
): entry is PerformanceEntry {
  return (
    entry != null &&
    typeof entry === "object" &&
    typeof (entry as Record<string, unknown>).startTime === "number" &&
    !Number.isNaN((entry as Record<string, unknown>).startTime)
  );
}

export function filterSafePerformanceEntries(
  entries: unknown,
): PerformanceEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter(isSafePerformanceEntry);
}

let installed = false;

export function installSafePerformanceMonitoring(): void {
  if (typeof window === "undefined" || installed) return;
  installed = true;

  // 1. Guard PerformanceObserver prototype takeRecords
  if (typeof window.PerformanceObserver !== "undefined") {
    const OriginalPO = window.PerformanceObserver;
    const proto = OriginalPO.prototype;
    if (proto && typeof proto.takeRecords === "function") {
      const origTakeRecords = proto.takeRecords;
      proto.takeRecords = function safeTakeRecords() {
        try {
          const records = origTakeRecords.call(this);
          return filterSafePerformanceEntries(records);
        } catch {
          return [];
        }
      };
    }

    // 2. Guard PerformanceObserver constructor callbacks
    try {
      const SafePerformanceObserver = function (
        this: unknown,
        callback: PerformanceObserverCallback,
      ) {
        const guardedCallback: PerformanceObserverCallback = (list, observer) => {
          try {
            if (list) {
              const origGetEntries = list.getEntries;
              if (typeof origGetEntries === "function") {
                list.getEntries = function () {
                  try {
                    return filterSafePerformanceEntries(origGetEntries.call(this));
                  } catch {
                    return [];
                  }
                };
              }

              const origGetByName = list.getEntriesByName;
              if (typeof origGetByName === "function") {
                list.getEntriesByName = function (name: string, type?: string) {
                  try {
                    return filterSafePerformanceEntries(origGetByName.call(this, name, type));
                  } catch {
                    return [];
                  }
                };
              }

              const origGetByType = list.getEntriesByType;
              if (typeof origGetByType === "function") {
                list.getEntriesByType = function (type: string) {
                  try {
                    return filterSafePerformanceEntries(origGetByType.call(this, type));
                  } catch {
                    return [];
                  }
                };
              }
            }
          } catch {
            /* ignore list decoration failure */
          }

          try {
            return callback(list, observer);
          } catch (err: unknown) {
            if (
              err instanceof TypeError &&
              err.message.includes("startTime")
            ) {
              console.warn(
                "[safe-performance] safely suppressed error accessing startTime:",
                err.message,
              );
              return;
            }
            throw err;
          }
        };

        return new OriginalPO(guardedCallback);
      };

      SafePerformanceObserver.prototype = OriginalPO.prototype;
      SafePerformanceObserver.supportedEntryTypes = OriginalPO.supportedEntryTypes;
      window.PerformanceObserver = SafePerformanceObserver as unknown as typeof PerformanceObserver;
    } catch {
      /* ignore */
    }
  }

  // 3. Guard window.performance.getEntries*
  if (typeof window.performance !== "undefined") {
    try {
      if (typeof window.performance.getEntriesByType === "function") {
        const origGetByType = window.performance.getEntriesByType.bind(window.performance);
        window.performance.getEntriesByType = function (type: string) {
          try {
            return filterSafePerformanceEntries(origGetByType(type));
          } catch {
            return [];
          }
        };
      }
      if (typeof window.performance.getEntriesByName === "function") {
        const origGetByName = window.performance.getEntriesByName.bind(window.performance);
        window.performance.getEntriesByName = function (name: string, type?: string) {
          try {
            return filterSafePerformanceEntries(origGetByName(name, type));
          } catch {
            return [];
          }
        };
      }
      if (typeof window.performance.getEntries === "function") {
        const origGetEntries = window.performance.getEntries.bind(window.performance);
        window.performance.getEntries = function () {
          try {
            return filterSafePerformanceEntries(origGetEntries());
          } catch {
            return [];
          }
        };
      }
    } catch {
      /* ignore */
    }
  }

  // 4. Global window error listener for any unhandled startTime errors
  window.addEventListener("error", (event) => {
    if (
      event.error instanceof TypeError &&
      event.error.message.includes("startTime")
    ) {
      console.warn(
        "[safe-performance] intercepted unhandled startTime error:",
        event.error.message,
      );
      event.preventDefault();
      event.stopPropagation();
    }
  });
}
