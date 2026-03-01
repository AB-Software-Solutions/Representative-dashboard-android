/* eslint-disable no-console */

// Make stacks longer/more useful
try {
  // eslint-disable-next-line no-undef
  Error.stackTraceLimit = 100;
} catch {}

function safeToString(x) {
  try {
    return String(x);
  } catch {
    return "[unprintable]";
  }
}

// React Native global error handler
try {
  const eu = global?.ErrorUtils;
  if (eu?.setGlobalHandler) {
    const prev = eu.getGlobalHandler ? eu.getGlobalHandler() : null;
    eu.setGlobalHandler((err, isFatal) => {
      try {
        console.error("[GLOBAL_ERROR]", { isFatal, message: err?.message, stack: err?.stack });
      } catch {
        console.error("[GLOBAL_ERROR]", safeToString(err));
      }
      if (typeof prev === "function") prev(err, isFatal);
    });
  }
} catch {}

