// Dynamic import so the ESM Express app loads correctly under Vercel's Node runtime
// (static require() of server/app.js fails with ERR_REQUIRE_ESM).
const appPromise = import("../server/app.js").then((mod) => mod.default);

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
