// Minimal HTTP server entry. Serves a single greeting route.

import express from "express";

const PORT: number = Number(process.env.PORT ?? 8000);

const app: express.Express = express();

app.get("/", (_request: express.Request, response: express.Response) => {
  response.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
