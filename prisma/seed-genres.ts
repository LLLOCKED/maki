import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const genres = [
  ['Ісейкай', 'isekai'],
  ['Наукова фантастика', 'sci-fi'],
  ['Екшен', 'action'],
  ['Бойові мистецтва', 'martial-arts'],
  ['Гарем', 'harem'],
  ['Героїчне фентезі', 'heroic-fantasy'],
  ['Джьосей', 'josei'],
  ['Для дорослих 16+', 'adult-16'],
  ['Для дорослих 18+', 'adult-18'],
  ['Драма', 'drama'],
  ['Ігрове', 'game'],
  ['Історичне', 'historical'],
  ['Комедія', 'comedy'],
  ['Мелодрама', 'melodrama'],
  ['Меха', 'mecha'],
  ['Мілітаризм', 'military'],
  ['Повсякденність', 'slice-of-life'],
  ['Пригоди', 'adventure'],
  ['Психологія', 'psychological'],
  ['Романтика', 'romance'],
  ['Надприродне', 'supernatural'],
  ['Спорт', 'sports'],
  ['Сейнен', 'seinen'],
  ['Сянься', 'xianxia'],
  ['Сюаньхуа', 'xuanhuan'],
  ['Сьодзьо', 'shoujo'],
  ['Сьонен', 'shounen'],
  ['Трагедія', 'tragedy'],
  ['Трилер', 'thriller'],
  ['Жахи', 'horror'],
  ['Уся', 'wuxia'],
  ['Фантастика', 'speculative-fiction'],
  ['Фанфіки', 'fanfiction'],
  ['Фентезі', 'fantasy'],
  ['Шкільне життя', 'school-life'],
  ['Еччі', 'ecchi'],
  ['Гумор', 'humor'],
  ['Яой', 'yaoi'],
  ['Містика', 'mystery'],
] as const

async function main() {
  for (const [name, slug] of genres) {
    await prisma.genre.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    })
  }

  const total = await prisma.genre.count()
  console.log(`Genres upserted: ${genres.length}`)
  console.log(`Total genres: ${total}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
