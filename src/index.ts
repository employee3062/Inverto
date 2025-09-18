import { Elysia , t} from "elysia";
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
.get("/", () => "It's Inverto 9")
.post("/signin",({body}) => {
  return `Created user ${body.username} with password ${body.password}.`
} ,{
  body:t.Object({
    username: t.String(),
    password: t.String()
  })
})
.all('*', (context) => {
  return `You hit catch-all path, Req Metadata:\n${JSON.stringify(context.request)}`;
})
.use(
  swagger({
    documentation: {
      info: {
        title: 'Inverto API',
        version: '1.0.0'
      }
    }
  })
)

// export for tests, server or lambda env depending on env variable
const exportedApp = process.env.SERVER_MODE === 'ON' ? app.listen(3000) : app;
export { exportedApp as app };
export default exportedApp.fetch;
