import { Elysia } from "elysia";
import { swagger } from '@elysiajs/swagger'

export const app = new Elysia().get("/", () => "It's Inverto").listen(3000);
app.use(
  swagger({
    documentation: {
        info: {
          title: 'Inverto API',
          version: '1.0.0'
        }
      }
  })
);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
