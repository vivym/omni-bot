import 'dotenv/config'
import { createServer } from './server.js'
import { connectAMQP } from './libs/amqp.js'
import { connectDB } from './libs/db.js'

async function main() {
  await connectAMQP()
  await connectDB()

  const server = createServer()

  await server.start()
}

main().catch(console.error)
