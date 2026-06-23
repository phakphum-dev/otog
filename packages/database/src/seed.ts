/*
import { PrismaClient } from '../__generated__/prisma-client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning existing database data...')
  await prisma.submission.deleteMany()
  await prisma.problem.deleteMany()
  await prisma.user.deleteMany()

  console.log('Seeding mock database...')

  // Create admin user
  // Hashed password for 'admin' is '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      showName: 'Admin',
      password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      role: 'admin',
      showInLeaderboard: false, // Hidden by default
    },
  })
  console.log('Admin user seeded.')

  // Create 10 normal users
  // Hashed password for 'password' is '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  const users = []
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        showName: `User ${i}`,
        password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        role: 'user',
        showInLeaderboard: true,
        rating: 0,
      },
    })
    users.push(user)
  }
  console.log('10 Normal users seeded.')

  // Create 10 mock problems
  const problems = []
  for (let i = 1; i <= 10; i++) {
    const sname = `mock${i}`
    const problem = await prisma.problem.create({
      data: {
        name: `Mock Problem ${i}`,
        sname,
        score: 100,
        timeLimit: 1000,
        memoryLimit: 32,
        show: true,
      },
    })
    problems.push(problem)
  }
  console.log('10 Mock problems seeded.')

  // Create mock submissions to populate the leaderboard
  console.log('Seeding mock submissions for leaderboard...')
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    // User 1 solves 1 problem, User 2 solves 2 problems, ..., User 10 solves 10 problems
    const solvedCount = i + 1

    for (let j = 0; j < solvedCount; j++) {
      const problem = problems[j]
      await prisma.submission.create({
        data: {
          userId: user.id,
          problemId: problem.id,
          status: 'accept',
          language: 'cpp',
          public: true,
        },
      })
    }
  }
  console.log('Mock submissions seeded.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

// pnpm --filter @otog/database reset
// username : 'user1', password : 'password'
// username : 'user2', password : 'password'
// username : 'user3', password : 'password'
// username : 'user4', password : 'password'
//  ...

// username : 'admin', password : 'admin'

*/