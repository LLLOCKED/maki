import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUsers() {
  const users = [
    {
      name: 'Олександр',
      email: 'alex@test.com',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    },
    {
      name: 'Марія',
      email: 'maria@test.com',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    },
    {
      name: 'Іван',
      email: 'ivan@test.com',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivan',
    },
    {
      name: 'Анна',
      email: 'anna@test.com',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna',
    },
    {
      name: 'Дмитро',
      email: 'dmytro@test.com',
      password: 'password123',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dmytro',
    },
  ]

  const createdUsers = []
  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 12)
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        image: userData.image,
        passwordHash,
      },
      create: {
        name: userData.name,
        email: userData.email,
        image: userData.image,
        passwordHash,
      },
    })
    createdUsers.push(user)
  }

  console.log('Created test users:', createdUsers.map(u => u.name).join(', '))
  return createdUsers
}

async function createForumTopics(users: any[], categories: any[]) {
  const topics = [
    {
      title: 'Чудова нова новела!',
      content: 'Знайшов чудову новелу в жанрі ісейкай. Дуже рекомендую до прочитання! Хтось ще читав?',
      categorySlug: 'discussion',
      userIndex: 0,
    },
    {
      title: 'Помилка при завантаженні глави',
      content: 'При спробі відкрити главу 5 новели "Магистр неведения" виникає помилка. Прошу виправити.',
      categorySlug: 'bugs',
      userIndex: 1,
    },
    {
      title: 'Шукаю перекладачів для нової новели',
      content: 'Є бажання перекласти популярну японську новелу. Потрібні: перекладач, редактор, тайпер.',
      categorySlug: 'team-search',
      userIndex: 2,
    },
    {
      title: 'Пропозиція щодо темної теми',
      content: 'Було б непогано додати можливість вибору темної теми для читання вночі.',
      categorySlug: 'suggestions',
      userIndex: 3,
    },
    {
      title: 'Який ваш улюблений жанр?',
      content: 'Цікаво дізнатися, який жанр найбільше подобається спільноті. Мій улюблений - ісейкай!',
      categorySlug: 'offtopic',
      userIndex: 4,
    },
    {
      title: 'Проблема з реєстрацією',
      content: 'Не можу зареєструватися на сайті. Після введення даних сторінка просто оновлюється.',
      categorySlug: 'bugs',
      userIndex: 0,
    },
    {
      title: 'Обговорення нової глави Магистр неведения',
      content: 'Щойно вийшла нова глава! Що думаєте про сюжет? Мені здається, що головний герой нарешті знайшов своє покликання.',
      categorySlug: 'discussion',
      userIndex: 1,
    },
    {
      title: 'Потрібен тайпер для команди',
      content: 'Наша команда шукає тайпера для роботи над новелами в жанрі романтика. Звертатися в особисті.',
      categorySlug: 'team-search',
      userIndex: 2,
    },
  ]

  const createdTopics = []
  for (const topicData of topics) {
    const category = categories.find(c => c.slug === topicData.categorySlug)
    const user = users[topicData.userIndex]

    const topic = await prisma.forumTopic.create({
      data: {
        title: topicData.title,
        content: topicData.content,
        userId: user.id,
        categoryId: category.id,
      },
    })
    createdTopics.push(topic)
  }

  console.log('Created forum topics:', createdTopics.length)
  return createdTopics
}

async function createForumComments(users: any[], topics: any[]) {
  const commentsData = [
    { topicIndex: 0, userIndex: 1, content: 'Дякую за рекомендацію! Обов\'язково спробую почитати.' },
    { topicIndex: 0, userIndex: 2, content: 'Теж читав, дуже захоплююча новела!' },
    { topicIndex: 0, userIndex: 3, content: 'Погоджуюсь, один з кращих ісейкаїв останнього часу.' },
    { topicIndex: 1, userIndex: 0, content: 'Спробуйте очистити кеш браузера та спробувати знову.' },
    { topicIndex: 1, userIndex: 4, content: 'У мене теж була така проблема, але сама вирішилась.' },
    { topicIndex: 2, userIndex: 1, content: 'Можу допомогти з перекладом! Маю досвід.' },
    { topicIndex: 2, userIndex: 3, content: 'А я можу редагувати. Пишіть в особисті.' },
    { topicIndex: 3, userIndex: 0, content: 'Чудова ідея! Темна тема дуже потрібна.' },
    { topicIndex: 4, userIndex: 2, content: 'Мій улюблений - романтика та фентезі!' },
    { topicIndex: 4, userIndex: 0, content: 'Обожнюю комедію та ісейкай.' },
    { topicIndex: 5, userIndex: 3, content: 'Спробуйте використати інший браузер.' },
    { topicIndex: 5, userIndex: 1, content: 'У мене一切都 працює. Може проблема в акаунті?' },
    { topicIndex: 6, userIndex: 4, content: 'Так, глава чудова! Герой розвивається як персонаж.' },
    { topicIndex: 6, userIndex: 0, content: 'Не можу дочекатися наступної глави!' },
  ]

  const createdComments = []
  for (const commentData of commentsData) {
    const comment = await prisma.forumComment.create({
      data: {
        content: commentData.content,
        userId: users[commentData.userIndex].id,
        topicId: topics[commentData.topicIndex].id,
      },
    })
    createdComments.push(comment)
  }

  console.log('Created forum comments:', createdComments.length)
  return createdComments
}

async function createTopicVotes(users: any[], topics: any[]) {
  const votesData = [
    { topicIndex: 0, userIndex: 1, value: 1 },
    { topicIndex: 0, userIndex: 2, value: 1 },
    { topicIndex: 0, userIndex: 3, value: 1 },
    { topicIndex: 1, userIndex: 2, value: -1 },
    { topicIndex: 2, userIndex: 0, value: 1 },
    { topicIndex: 2, userIndex: 3, value: 1 },
    { topicIndex: 3, userIndex: 1, value: 1 },
    { topicIndex: 3, userIndex: 4, value: 1 },
    { topicIndex: 4, userIndex: 0, value: 1 },
    { topicIndex: 5, userIndex: 2, value: -1 },
    { topicIndex: 6, userIndex: 1, value: 1 },
    { topicIndex: 6, userIndex: 2, value: 1 },
    { topicIndex: 6, userIndex: 3, value: 1 },
    { topicIndex: 7, userIndex: 4, value: 1 },
  ]

  for (const voteData of votesData) {
    await prisma.forumTopicVote.upsert({
      where: {
        userId_topicId: {
          userId: users[voteData.userIndex].id,
          topicId: topics[voteData.topicIndex].id,
        },
      },
      update: { value: voteData.value },
      create: {
        userId: users[voteData.userIndex].id,
        topicId: topics[voteData.topicIndex].id,
        value: voteData.value,
      },
    })
  }

  console.log('Created topic votes:', votesData.length)
}

async function createNovelComments(users: any[], novels: any[]) {
  const commentsData = [
    { novelIndex: 0, userIndex: 0, content: 'Чудова новела! Головний герой неймовірно розвивається протягом історії.' },
    { novelIndex: 0, userIndex: 1, content: 'Мене затягнуло з перших сторінок. Рекомендую всім!' },
    { novelIndex: 1, userIndex: 2, content: 'Системний адміністратор - класика жанру. Читав всю ніч!' },
    { novelIndex: 1, userIndex: 3, content: 'Погоджуюсь, одна з найкращих ісейкай новел.' },
    { novelIndex: 2, userIndex: 4, content: 'Непогано, але темп розповіді міг би бути швидшим.' },
    { novelIndex: 3, userIndex: 0, content: 'Романтика на найвищому рівні! Два головних герої - просто ідеал.' },
    { novelIndex: 4, userIndex: 1, content: 'Гострий сюжет та цікаві бойові сцени. Читаю далі!' },
    { novelIndex: 5, userIndex: 2, content: 'Затишна атмосфера та милі персонажі. Захоплює.' },
    { novelIndex: 6, userIndex: 3, content: 'Епічний сюжет та непередбачувані повороти. Рекомендую!' },
    { novelIndex: 7, userIndex: 4, content: 'Цікава концепція, але переклад призупинився. Шкода.' },
  ]

  const createdComments = []
  for (const commentData of commentsData) {
    const comment = await prisma.comment.create({
      data: {
        content: commentData.content,
        userId: users[commentData.userIndex].id,
        novelId: novels[commentData.novelIndex].id,
      },
    })
    createdComments.push(comment)
  }

  console.log('Created novel comments:', createdComments.length)
  return createdComments
}

async function main() {
  // Create forum categories
  const forumCategories = await Promise.all([
    prisma.forumCategory.upsert({
      where: { slug: 'bugs' },
      update: { name: 'Помилки', description: 'Повідомлення про помилки' },
      create: { name: 'Помилки', slug: 'bugs', description: 'Повідомлення про помилки', color: '#ef4444', order: 1 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'discussion' },
      update: { name: 'Обговорення', description: 'Загальні питання та обговорення' },
      create: { name: 'Обговорення', slug: 'discussion', description: 'Загальні питання та обговорення', color: '#6366f1', order: 2 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'team-search' },
      update: { name: 'Пошук команди', description: 'Пошук команди для перекладу' },
      create: { name: 'Пошук команди', slug: 'team-search', description: 'Пошук команди для перекладу', color: '#22c55e', order: 3 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'suggestions' },
      update: { name: 'Пропозиції', description: 'Ваші ідеї та пропозиції' },
      create: { name: 'Пропозиції', slug: 'suggestions', description: 'Ваші ідеї та пропозиції', color: '#f59e0b', order: 4 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'offtopic' },
      update: { name: 'Офтоп', description: 'Все інше' },
      create: { name: 'Офтоп', slug: 'offtopic', description: 'Все інше', color: '#6b7280', order: 5 },
    }),
  ])

  console.log('Created forum categories:', forumCategories.map(c => c.name).join(', '))

  // Create genres
  const genres = await Promise.all([
    prisma.genre.upsert({
      where: { slug: 'isekai' },
      update: {},
      create: { name: 'Ісейкай', slug: 'isekai' },
    }),
    prisma.genre.upsert({
      where: { slug: 'romance' },
      update: {},
      create: { name: 'Романтика', slug: 'romance' },
    }),
    prisma.genre.upsert({
      where: { slug: 'action' },
      update: {},
      create: { name: 'Екшен', slug: 'action' },
    }),
    prisma.genre.upsert({
      where: { slug: 'fantasy' },
      update: {},
      create: { name: 'Фентезі', slug: 'fantasy' },
    }),
    prisma.genre.upsert({
      where: { slug: 'comedy' },
      update: {},
      create: { name: 'Комедія', slug: 'comedy' },
    }),
    prisma.genre.upsert({
      where: { slug: 'drama' },
      update: {},
      create: { name: 'Драма', slug: 'drama' },
    }),
  ])

  // Create publishers
  const publishers = await Promise.all([
    prisma.publisher.upsert({
      where: { name: 'Kadokawa' },
      update: {},
      create: { name: 'Kadokawa' },
    }),
    prisma.publisher.upsert({
      where: { name: 'Shueisha' },
      update: {},
      create: { name: 'Shueisha' },
    }),
    prisma.publisher.upsert({
      where: { name: 'MEDIA FACTORY' },
      update: {},
      create: { name: 'MEDIA FACTORY' },
    }),
    prisma.publisher.upsert({
      where: { name: 'OVERLAP' },
      update: {},
      create: { name: 'OVERLAP' },
    }),
  ])

  // Create authors
  const authors = await Promise.all([
    prisma.author.upsert({
      where: { name: 'Алекс Кун' },
      update: {},
      create: { name: 'Алекс Кун' },
    }),
    prisma.author.upsert({
      where: { name: 'Риэ Ямагато' },
      update: {},
      create: { name: 'Риэ Ямагато' },
    }),
    prisma.author.upsert({
      where: { name: 'Коджи Огура' },
      update: {},
      create: { name: 'Коджи Огура' },
    }),
    prisma.author.upsert({
      where: { name: 'Юки Ариму' },
      update: {},
      create: { name: 'Юки Ариму' },
    }),
    prisma.author.upsert({
      where: { name: 'Рю Ханада' },
      update: {},
      create: { name: 'Рю Ханада' },
    }),
    prisma.author.upsert({
      where: { name: 'Мина Кото' },
      update: {},
      create: { name: 'Мина Кото' },
    }),
    prisma.author.upsert({
      where: { name: 'Дайго Кавамура' },
      update: {},
      create: { name: 'Дайго Кавамура' },
    }),
    prisma.author.upsert({
      where: { name: 'Юсуке Мори' },
      update: {},
      create: { name: 'Юсуке Мори' },
    }),
    prisma.author.upsert({
      where: { name: 'Акира Фуджи' },
      update: {},
      create: { name: 'Акира Фуджи' },
    }),
  ])

  // Create teams
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { name: 'MangaLib' },
      update: {},
      create: { name: 'MangaLib', description: 'Лучший перевод манги и новел' },
    }),
    prisma.team.upsert({
      where: { name: 'Hikari' },
      update: {},
      create: { name: 'Hikari', description: 'Японская классика и современные работы' },
    }),
    prisma.team.upsert({
      where: { name: 'Natsume' },
      update: {},
      create: { name: 'Natsume', description: 'Исекаи и фэнтези' },
    }),
  ])

  // Create novels
  const novelsData = [
    {
      title: 'Магистр неведения',
      slug: 'magister-nevedeniya',
      originalName: '無知の大魔術師',
      authorName: 'Алекс Кун',
      description:
        'Обычный программист внезапно переродился в мире магии. Теперь он — маг, который ничего не знает о своём мире, но обладает силой, способной изменить расстановку сил.',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop',
      averageRating: 4.8,
      viewCount: 15420,
      type: 'ORIGINAL',
      status: 'ONGOING',
      translationStatus: 'TRANSLATING',
      releaseYear: 2023,
      genres: { isekai: true, fantasy: true },
      publishers: ['OVERLAP'],
    },
    {
      title: 'Системный администратор',
      slug: 'system-administrator',
      originalName: 'システム管理者',
      authorName: 'Риэ Ямагато',
      description:
        'Бывший айтишник, погибший от переработки, переродился в теле мальчика из аристократической семьи. В новом мире он находит систему — тот самый интерфейс администратора, но теперь он управляет государством.',
      coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=600&fit=crop',
      averageRating: 4.6,
      viewCount: 12350,
      type: 'JAPAN',
      status: 'ONGOING',
      translationStatus: 'TRANSLATING',
      releaseYear: 2022,
      genres: { isekai: true, comedy: true },
      publishers: ['Kadokawa'],
    },
    {
      title: 'Рождённый воином',
      slug: 'rozhdennyy-voinom',
      originalName: '戦士として生まれた',
      authorName: 'Коджи Огура',
      description:
        'В мире, где сила определяет всё, родители мечтали о сыне-маге. Но судьба распорядилась иначе — их сын стал величайшим воином, которого когда-либо видел этот мир.',
      coverUrl: 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=400&h=600&fit=crop',
      averageRating: 4.5,
      viewCount: 9870,
      type: 'JAPAN',
      status: 'COMPLETED',
      translationStatus: 'COMPLETED',
      releaseYear: 2021,
      genres: { action: true, fantasy: true },
      publishers: ['Shueisha'],
    },
    {
      title: 'Любовь и магия',
      slug: 'lyubov-i-magiya',
      originalName: '愛と魔法',
      authorName: 'Юки Ариму',
      description:
        'Два студента магической академии: один — гениальный маг, другая — талантливая, но ленивая. Их случайная встреча запускает цепочку событий, которая изменит академию навсегда.',
      coverUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
      averageRating: 4.3,
      viewCount: 8560,
      type: 'JAPAN',
      status: 'ONGOING',
      translationStatus: 'TRANSLATING',
      releaseYear: 2023,
      genres: { romance: true, fantasy: true, comedy: true },
      publishers: ['MEDIA FACTORY'],
    },
    {
      title: 'Путь меча',
      slug: 'put-mecha',
      originalName: '剣の道',
      authorName: 'Рю Ханада',
      description:
        'Бывший чемпион по фехтованию неожиданно для себя оказался в средневековом мире, где искусство меча определяет социальный статус. Теперь ему предстоит пройти путь от простого крестьянина до величайшего мастера клинка.',
      coverUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop',
      averageRating: 4.7,
      viewCount: 11200,
      type: 'JAPAN',
      status: 'ONGOING',
      translationStatus: 'HIATUS',
      releaseYear: 2022,
      genres: { action: true, fantasy: true, drama: true },
      publishers: ['OVERLAP'],
    },
    {
      title: 'Кофейня на краю мира',
      slug: 'kofeynya-na-krayu-sveta',
      originalName: '世界端のカフェ',
      authorName: 'Мина Кото',
      description:
        'Обычная девушка-студентка унаследовала странную кофейню от бабушки. Каждый посетитель этого места приносит с собой удивительную историю. За чашкой кофе раскрываются самые сокровенные тайны.',
      coverUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=600&fit=crop',
      averageRating: 4.4,
      viewCount: 6340,
      type: 'JAPAN',
      status: 'COMPLETED',
      translationStatus: 'COMPLETED',
      releaseYear: 2021,
      genres: { romance: true, drama: true },
      publishers: ['Kadokawa'],
    },
    {
      title: 'Последний герой',
      slug: 'posledniy-geroy',
      originalName: '最後の英雄',
      authorName: 'Дайго Кавамура',
      description:
        'В мире, где демоны давно уничтожены, а герои стали легендой, один молодой парень случайно обнаруживает, что он — последний потомок легендарного героя. И его ждёт путь, полный испытаний.',
      coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop',
      averageRating: 4.6,
      viewCount: 7890,
      type: 'JAPAN',
      status: 'ONGOING',
      translationStatus: 'TRANSLATING',
      releaseYear: 2023,
      genres: { action: true, fantasy: true },
      publishers: ['Shueisha'],
    },
    {
      title: 'Тени старого Токио',
      slug: 'teni-starogo-tokio',
      originalName: '古い東京の影',
      authorName: 'Юсуке Мори',
      description:
        'Современный Токио хранит множество секретов. За неоновыми огнями скрываются тени древних кланов, магические ритуалы и монстры из японской мифологии. Обычный школьник случайно становится свидетелем битвы экзорцистов.',
      coverUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=600&fit=crop',
      averageRating: 4.5,
      viewCount: 5670,
      type: 'JAPAN',
      status: 'SUSPENDED',
      translationStatus: 'DROPPED',
      releaseYear: 2022,
      genres: { action: true, fantasy: true },
      publishers: ['MEDIA FACTORY'],
    },
    {
      title: 'Записки подпольного мага',
      slug: 'zapiski-podpolnogo-maga',
      originalName: '地下魔導書',
      authorName: 'Акира Фуджи',
      description:
        'В мире, где магия строго контролируется государством, молодой маг вынужден скрывать свои способности. Ведя двойную жизнь, он записывает свои приключения в секретный дневник.',
      coverUrl: 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=400&h=600&fit=crop',
      averageRating: 4.2,
      viewCount: 4320,
      type: 'JAPAN',
      status: 'ONGOING',
      translationStatus: 'TRANSLATING',
      releaseYear: 2023,
      genres: { fantasy: true, comedy: true },
      publishers: ['OVERLAP'],
    },
  ]

  for (const novelData of novelsData) {
    const {
      genres: novelGenres,
      publishers: novelPublishers,
      authorName,
      ...novel
    } = novelData

    const createdNovel = await prisma.novel.upsert({
      where: { slug: novel.slug },
      update: novel,
      create: novel,
    })

    // Link genres
    for (const genreSlug of Object.keys(novelGenres)) {
      const genre = genres.find((g) => g.slug === genreSlug)
      if (genre) {
        await prisma.novelGenre.upsert({
          where: {
            novelId_genreId: {
              novelId: createdNovel.id,
              genreId: genre.id,
            },
          },
          update: {},
          create: {
            novelId: createdNovel.id,
            genreId: genre.id,
          },
        })
      }
    }

    // Link publisher
    for (const pubName of novelPublishers) {
      const publisher = publishers.find((p) => p.name === pubName)
      if (publisher) {
        await prisma.novelPublisher.upsert({
          where: {
            novelId_publisherId: {
              novelId: createdNovel.id,
              publisherId: publisher.id,
            },
          },
          update: {},
          create: {
            novelId: createdNovel.id,
            publisherId: publisher.id,
          },
        })
      }
    }

    // Link author
    const author = authors.find((a) => a.name === authorName)
    if (author) {
      await prisma.novelAuthor.upsert({
        where: {
          novelId_authorId: {
            novelId: createdNovel.id,
            authorId: author.id,
          },
        },
        update: {},
        create: {
          novelId: createdNovel.id,
          authorId: author.id,
        },
      })
    }

    // Create chapters
    const chapterCount = Math.floor(Math.random() * 10) + 5
    const team = teams[Math.floor(Math.random() * teams.length)]

    for (let i = 1; i <= chapterCount; i++) {
      await prisma.chapter.create({
        data: {
          novelId: createdNovel.id,
          teamId: team.id,
          title: `Глава ${i}`,
          number: i,
          content: generateChapterContent(i),
        },
      })
    }

    console.log(
      `Created novel: ${novel.title} with ${chapterCount} chapters (team: ${team.name})`
    )
  }

  // Get all created novels for comments
  const allNovels = await prisma.novel.findMany()

  // Create test users
  const users = await createTestUsers()

  // Create forum topics and comments
  const topics = await createForumTopics(users, forumCategories)
  await createForumComments(users, topics)
  await createTopicVotes(users, topics)

  // Create novel comments
  await createNovelComments(users, allNovels)
}

function generateChapterContent(chapterNum: number): string {
  return `# Глава ${chapterNum}

Это первая глава истории. Здесь начинается увлекательное путешествие героя по новому миру.

## Часть 1

Главный герой проснулся в незнакомом месте. Голова раскалывалась, а воспоминания смешивались в кучу.

> "Где я?" — подумал он, осматриваясь вокруг.

Комната была небольшой, но уютной. На столе лежали какие-то книги, а за окном виднелся сад.

### Что произошло?

Герой попытался вспомнить, как он здесь оказался. Последнее, что он помнил — это работа за компьютером до глубокой ночи.

- Ночь
- Работа
- Усталость
- И... темнота

А потом он открыл глаза здесь.

## Часть 2

Спустя некоторое время герой понял, что произошло нечто невероятное. Он переродился!

Это был новый мир с новыми правилами. И ему предстояло найти своё место в нём.

\`\`\`
Добро пожаловать в новый мир!
\`\`\`

Продолжение следует...
`
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
