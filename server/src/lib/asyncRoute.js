// Express 4 does not catch rejected promises, so every route handler goes through this.
export const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch((err) => {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    // Outside production, say what really went wrong so the app can show it.
    const detail = process.env.NODE_ENV === "production" ? undefined : `${err.name}: ${err.message}`;
    return res.status(500).json({ error: "Server error", detail });
  });

// Wraps every handler registered on a router, so routes can be plain async functions.
export function wrapRouter(router) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const register = router[method].bind(router);
    router[method] = (path, ...handlers) => register(path, ...handlers.map(asyncRoute));
  }
  return router;
}
