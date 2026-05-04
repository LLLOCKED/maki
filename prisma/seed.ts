import {
  BookmarkStatus,
  ModerationStatus,
  NovelStatus,
  NovelType,
  PrismaClient,
  TeamRole,
  TranslationStatus,
  UserRole,
} from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

const seededEmails = [
  'admin@honni.local',
  'yuna@honni.local',
  'ren@honni.local',
  'mira@honni.local',
  'kai@honni.local',
  'sora@honni.local',
  'alex@test.com',
  'maria@test.com',
  'ivan@test.com',
  'anna@test.com',
  'dmytro@test.com',
]

const oldNovelSlugs = [
  'magister-nevedeniya',
  'system-administrator',
  'rozhdennyy-voinom',
  'lyubov-i-magiya',
  'put-mecha',
  'kofeynya-na-krayu-sveta',
  'posledniy-geroy',
  'teni-starogo-tokio',
  'zapiski-podpolnogo-maga',
]

const novelsData = [
  {
    title: 'Хроніки місячного архіва',
    slug: 'hroniky-misiachnoho-arhiva',
    originalName: '月光書庫の年代記',
    author: 'Аой Сакамото',
    description:
      'Лін, помічниця бібліотекаря з провінційного міста, знаходить архів, де книги переписують майбутнє. Кожна прочитана сторінка відкриває нову гілку долі, але за кожну правку світ забирає спогад.',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&h=750&fit=crop',
    type: NovelType.JAPAN,
    status: NovelStatus.ONGOING,
    translationStatus: TranslationStatus.TRANSLATING,
    releaseYear: 2024,
    averageRating: 4.9,
    viewCount: 28450,
    genres: ['fantasy', 'mystery', 'drama'],
    tags: ['magic-academy', 'ancient-library', 'slow-burn'],
    publishers: ['Kadokawa Beans Bunko'],
    chapters: 12,
    team: 'moon-rabbit',
  },
  {
    title: 'Я переродився як фінальний бос, але хочу відкрити чайну',
    slug: 'finalnyi-bos-i-chaina',
    originalName: 'ラスボスだけど喫茶店を開きたい',
    author: 'Хару Нанасе',
    description:
      'Колишній офісний працівник прокидається в тілі демона, якого герої мають перемогти в останньому томі роману. Замість війни він орендує будиночок біля тракту й варить чай для мандрівників.',
    coverUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=750&fit=crop',
    type: NovelType.JAPAN,
    status: NovelStatus.ONGOING,
    translationStatus: TranslationStatus.TRANSLATING,
    releaseYear: 2023,
    averageRating: 4.7,
    viewCount: 19820,
    genres: ['isekai', 'comedy', 'slice-of-life'],
    tags: ['villain-protagonist', 'cozy', 'food'],
    publishers: ['MF Books'],
    chapters: 10,
    team: 'foxglove',
  },
  {
    title: 'Лицарка без мани',
    slug: 'lytsarka-bez-many',
    originalName: '魔力ゼロの騎士令嬢',
    author: 'Міна Кірісава',
    description:
      'У королівстві, де статус визначає кількість мани, донька герцога не має жодної іскри магії. Вона бере меч, тренується потай і доводить академії, що дисципліна може перемогти талант.',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&h=750&fit=crop',
    type: NovelType.JAPAN,
    status: NovelStatus.COMPLETED,
    translationStatus: TranslationStatus.COMPLETED,
    releaseYear: 2022,
    averageRating: 4.8,
    viewCount: 24110,
    genres: ['action', 'fantasy', 'romance'],
    tags: ['strong-heroine', 'academy', 'swordplay'],
    publishers: ['Overlap Novels'],
    chapters: 14,
    team: 'moon-rabbit',
  },
  {
    title: 'Після титрів сьомого світу',
    slug: 'pislia-tytriv-somoho-svitu',
    originalName: '七番目の世界のエンドロール',
    author: 'Рен Амагі',
    description:
      'Герой уже шість разів рятував різні світи й щоразу повертався до порожньої кімнати. Сьомий світ зустрічає його не монстрами, а людьми, які знають про попередні фінали.',
    coverUrl: 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=500&h=750&fit=crop',
    type: NovelType.JAPAN,
    status: NovelStatus.ONGOING,
    translationStatus: TranslationStatus.HIATUS,
    releaseYear: 2024,
    averageRating: 4.6,
    viewCount: 13640,
    genres: ['isekai', 'psychological', 'drama'],
    tags: ['loop', 'tragic-past', 'plot-twist'],
    publishers: ['Dengeki Bunko'],
    chapters: 8,
    team: 'starfall',
  },
  {
    title: 'Пошта для богів забутих храмів',
    slug: 'poshta-dlia-bohiv-zabutykh-hramiv',
    originalName: '忘れられた神々への郵便',
    author: 'Юі Морі',
    description:
      'Кур’єрка Нана доставляє листи тим богам, про яких перестали молитися. Кожен конверт може повернути храм до життя або остаточно стерти його ім’я з пам’яті людей.',
    coverUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=500&h=750&fit=crop',
    type: NovelType.JAPAN,
    status: NovelStatus.ONGOING,
    translationStatus: TranslationStatus.TRANSLATING,
    releaseYear: 2023,
    averageRating: 4.5,
    viewCount: 11390,
    genres: ['fantasy', 'drama', 'slice-of-life'],
    tags: ['gods', 'journey', 'melancholy'],
    publishers: ['Kadokawa Beans Bunko'],
    chapters: 9,
    team: 'starfall',
  },
  {
    title: 'Регресор відкрив крамницю артефактів',
    slug: 'rehresor-vidkryv-kramnytsiu-artefaktiv',
    originalName: '回帰者の道具屋',
    author: 'Со Джінхо',
    description:
      'Після поразки в останній битві мисливець повертається на десять років назад. Цього разу він не вступає до гільдії, а відкриває маленьку крамницю, де продає артефакти майбутнього.',
    coverUrl: 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=500&h=750&fit=crop',
    type: NovelType.KOREA,
    status: NovelStatus.ONGOING,
    translationStatus: TranslationStatus.TRANSLATING,
    releaseYear: 2024,
    averageRating: 4.7,
    viewCount: 17680,
    genres: ['action', 'fantasy', 'comedy'],
    tags: ['regression', 'dungeons', 'merchant'],
    publishers: ['Naver Series'],
    chapters: 11,
    team: 'foxglove',
  },
  {
    title: 'Синя весна екзорцистки',
    slug: 'synia-vesna-ekzortsystky',
    originalName: '祓い屋の青い春',
    author: 'Каеде Фудзімото',
    description:
      'Старшокласниця Аса має бачити духів, але мріє про нормальне життя. Коли в її клас переводиться спадкоємець клану екзорцистів, доводиться обирати між тишею і правдою.',
    coverUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&h=750&fit=crop',
    type: NovelType.JAPAN,
    status: NovelStatus.ONGOING,
    translationStatus: TranslationStatus.TRANSLATING,
    releaseYear: 2022,
    averageRating: 4.4,
    viewCount: 9270,
    genres: ['romance', 'mystery', 'supernatural'],
    tags: ['school', 'exorcists', 'urban-fantasy'],
    publishers: ['Dengeki Bunko'],
    chapters: 7,
    team: 'moon-rabbit',
  },
  {
    title: 'Підземелля під книгарнею',
    slug: 'pidzemellia-pid-knyharneiu',
    originalName: '書店地下の迷宮',
    author: 'Нацу Окамото',
    description:
      'Антикварна книгарня в Кіото приховує сходи до підземелля, яке змінюється щоночі. Продавець і постійна покупчиня укладають угоду: вона малює мапи, він шукає книги, що зникли зі світу.',
    coverUrl: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=500&h=750&fit=crop',
    type: NovelType.JAPAN,
    status: NovelStatus.SUSPENDED,
    translationStatus: TranslationStatus.DROPPED,
    releaseYear: 2021,
    averageRating: 4.2,
    viewCount: 6840,
    genres: ['mystery', 'fantasy'],
    tags: ['dungeon', 'books', 'kyoto'],
    publishers: ['MF Books'],
    chapters: 6,
    team: 'starfall',
  },
]

type SeedNovel = (typeof novelsData)[number]

async function cleanupSeedData() {
  const slugs = [...oldNovelSlugs, ...novelsData.map((novel) => novel.slug)]
  const teamSlugs = ['moon-rabbit', 'foxglove', 'starfall', 'mangalib', 'hikari', 'natsume']
  const announcementTitles = [
    'Добірка тижня: магія, пригоди та нові світи',
    'Нова глава Магістра неведення',
    'Форум ожив: шукають перекладачів',
    'Новий сезон перекладів на honni',
    'Тайтл тижня: Хроніки місячного архіва',
    'Команди шукають редакторів і перекладачів',
  ]

  await prisma.notification.deleteMany({
    where: {
      OR: [
        { user: { email: { in: seededEmails } } },
        { novel: { slug: { in: slugs } } },
      ],
    },
  })
  await prisma.forumTopic.deleteMany({
    where: {
      OR: [
        { user: { email: { in: seededEmails } } },
        { title: { contains: 'seed:' } },
      ],
    },
  })
  await prisma.comment.deleteMany({
    where: {
      OR: [
        { user: { email: { in: seededEmails } } },
        { novel: { slug: { in: slugs } } },
      ],
    },
  })
  await prisma.novel.deleteMany({ where: { slug: { in: slugs } } })
  await prisma.team.deleteMany({ where: { slug: { in: teamSlugs } } })
  await prisma.announcement.deleteMany({ where: { title: { in: announcementTitles } } })
  await prisma.user.deleteMany({ where: { email: { in: seededEmails } } })

  const unusedEntitySlugs = [
    ...new Set([
      ...novelsData.flatMap((novel) => [...novel.genres, ...novel.tags]),
      'isekai',
      'romance',
      'action',
      'fantasy',
      'comedy',
      'drama',
      'adventures',
      'everyday-life',
      'school',
      'historical',
      'psychology',
      'strong-hero',
      'slow-pace',
    ]),
  ]
  await prisma.tag.deleteMany({ where: { slug: { in: unusedEntitySlugs } } })
  await prisma.genre.deleteMany({ where: { slug: { in: unusedEntitySlugs } } })
  await prisma.author.deleteMany({ where: { name: { in: novelsData.map((novel) => novel.author) } } })
  await prisma.publisher.deleteMany({ where: { name: { in: [...new Set(novelsData.flatMap((novel) => novel.publishers))] } } })
}

async function createUsers() {
  const passwordHash = await bcrypt.hash('admin123', 12)
  const readerPasswordHash = await bcrypt.hash('reader123', 12)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Адмін honni',
        email: 'admin@honni.local',
        passwordHash,
        role: UserRole.ADMIN,
        emailVerified: new Date(),
        image: 'https://api.dicebear.com/9.x/avataaars/svg?seed=honni-admin',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Юна Рідер',
        email: 'yuna@honni.local',
        passwordHash: readerPasswordHash,
        role: UserRole.USER,
        emailVerified: new Date(),
        image: 'https://api.dicebear.com/9.x/avataaars/svg?seed=yuna',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Рен Перекладач',
        email: 'ren@honni.local',
        passwordHash: readerPasswordHash,
        role: UserRole.USER,
        emailVerified: new Date(),
        image: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ren',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Міра Редакторка',
        email: 'mira@honni.local',
        passwordHash: readerPasswordHash,
        role: UserRole.USER,
        emailVerified: new Date(),
        image: 'https://api.dicebear.com/9.x/avataaars/svg?seed=mira',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Кай Коментатор',
        email: 'kai@honni.local',
        passwordHash: readerPasswordHash,
        role: UserRole.USER,
        emailVerified: new Date(),
        image: 'https://api.dicebear.com/9.x/avataaars/svg?seed=kai',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Сора Бета',
        email: 'sora@honni.local',
        passwordHash: readerPasswordHash,
        role: UserRole.USER,
        emailVerified: new Date(),
        image: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sora',
      },
    }),
  ])

  console.log('Seed users:', users.map((user) => user.email).join(', '))
  return users
}

async function createForumCategories() {
  return Promise.all([
    prisma.forumCategory.upsert({
      where: { slug: 'discussion' },
      update: { name: 'Обговорення', description: 'Враження від тайтлів, теорії та рекомендації', color: '#6366f1', order: 1 },
      create: { name: 'Обговорення', slug: 'discussion', description: 'Враження від тайтлів, теорії та рекомендації', color: '#6366f1', order: 1 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'team-search' },
      update: { name: 'Пошук команди', description: 'Набір перекладачів, редакторів і коректорів', color: '#22c55e', order: 2 },
      create: { name: 'Пошук команди', slug: 'team-search', description: 'Набір перекладачів, редакторів і коректорів', color: '#22c55e', order: 2 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'suggestions' },
      update: { name: 'Пропозиції', description: 'Ідеї для сайту та читача', color: '#f59e0b', order: 3 },
      create: { name: 'Пропозиції', slug: 'suggestions', description: 'Ідеї для сайту та читача', color: '#f59e0b', order: 3 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'bugs' },
      update: { name: 'Помилки', description: 'Проблеми з главами або інтерфейсом', color: '#ef4444', order: 4 },
      create: { name: 'Помилки', slug: 'bugs', description: 'Проблеми з главами або інтерфейсом', color: '#ef4444', order: 4 },
    }),
  ])
}

async function createTaxonomy() {
  const genres = await Promise.all([
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
  ].map(([name, slug]) => prisma.genre.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  })))

  const tags = await Promise.all([
    ['Магічна академія', 'magic-academy'],
    ['Стародавня бібліотека', 'ancient-library'],
    ['Повільна романтика', 'slow-burn'],
    ['Протагоніст-лиходій', 'villain-protagonist'],
    ['Затишна атмосфера', 'cozy'],
    ['Їжа та чай', 'food'],
    ['Сильна героїня', 'strong-heroine'],
    ['Академія', 'academy'],
    ['Фехтування', 'swordplay'],
    ['Петля часу', 'loop'],
    ['Трагічне минуле', 'tragic-past'],
    ['Сюжетний поворот', 'plot-twist'],
    ['Боги', 'gods'],
    ['Подорож', 'journey'],
    ['Меланхолія', 'melancholy'],
    ['Регресія', 'regression'],
    ['Підземелля', 'dungeons'],
    ['Крамниця', 'merchant'],
    ['Школа', 'school'],
    ['Екзорцисти', 'exorcists'],
    ['Міське фентезі', 'urban-fantasy'],
    ['Книги', 'books'],
    ['Кіото', 'kyoto'],
    ['Данж', 'dungeon'],
  ].map(([name, slug]) => prisma.tag.create({ data: { name, slug } })))

  const publishers = await Promise.all(
    [...new Set(novelsData.flatMap((novel) => novel.publishers))]
      .map((name) => prisma.publisher.create({ data: { name, slug: slugify(name) } }))
  )

  const authors = await Promise.all(
    novelsData.map((novel) => prisma.author.create({ data: { name: novel.author, slug: slugify(novel.author) } }))
  )

  return { genres, tags, publishers, authors }
}

async function createTeams(users: Awaited<ReturnType<typeof createUsers>>) {
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: 'Moon Rabbit',
        slug: 'moon-rabbit',
        description: 'Перекладаємо магічні академії, романтичне фентезі та атмосферні ранобе.',
        avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=moon-rabbit',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Foxglove',
        slug: 'foxglove',
        description: 'Команда для ісейкаїв, регресорів, бойових тайтлів і затишних комедій.',
        avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=foxglove',
      },
    }),
    prisma.team.create({
      data: {
        name: 'Starfall',
        slug: 'starfall',
        description: 'Любимо містичні історії, меланхолійне фентезі та складні сюжетні петлі.',
        avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=starfall',
      },
    }),
  ])

  const memberships = [
    { user: 0, team: 0, role: TeamRole.owner },
    { user: 2, team: 0, role: TeamRole.admin },
    { user: 3, team: 0, role: TeamRole.member },
    { user: 2, team: 1, role: TeamRole.owner },
    { user: 4, team: 1, role: TeamRole.member },
    { user: 3, team: 2, role: TeamRole.owner },
    { user: 5, team: 2, role: TeamRole.member },
  ]

  await prisma.teamMembership.createMany({
    data: memberships.map((membership) => ({
      userId: users[membership.user].id,
      teamId: teams[membership.team].id,
      role: membership.role,
    })),
  })

  return teams
}

async function createNovels(
  taxonomy: Awaited<ReturnType<typeof createTaxonomy>>,
  teams: Awaited<ReturnType<typeof createTeams>>
) {
  const novels = []

  for (const novelData of novelsData) {
    const team = teams.find((item) => item.slug === novelData.team)!
    const novel = await prisma.novel.create({
      data: {
        title: novelData.title,
        slug: novelData.slug,
        originalName: novelData.originalName,
        description: novelData.description,
        coverUrl: novelData.coverUrl,
        type: novelData.type,
        status: novelData.status,
        translationStatus: novelData.translationStatus,
        releaseYear: novelData.releaseYear,
        averageRating: novelData.averageRating,
        viewCount: novelData.viewCount,
        moderationStatus: ModerationStatus.APPROVED,
      },
    })

    await prisma.novelGenre.createMany({
      data: novelData.genres.map((slug) => ({
        novelId: novel.id,
        genreId: taxonomy.genres.find((genre) => genre.slug === slug)!.id,
      })),
    })

    await prisma.novelTag.createMany({
      data: novelData.tags.map((slug) => ({
        novelId: novel.id,
        tagId: taxonomy.tags.find((tag) => tag.slug === slug)!.id,
      })),
    })

    await prisma.novelPublisher.createMany({
      data: novelData.publishers.map((name) => ({
        novelId: novel.id,
        publisherId: taxonomy.publishers.find((publisher) => publisher.name === name)!.id,
      })),
    })

    await prisma.novelAuthor.create({
      data: {
        novelId: novel.id,
        authorId: taxonomy.authors.find((author) => author.name === novelData.author)!.id,
      },
    })

    for (let chapterNumber = 1; chapterNumber <= novelData.chapters; chapterNumber++) {
      await prisma.chapter.create({
        data: {
          novelId: novel.id,
          teamId: team.id,
          number: chapterNumber,
          volume: chapterNumber > 8 ? 2 : 1,
          title: chapterTitle(novelData, chapterNumber),
          content: generateChapterContent(novelData, chapterNumber),
          moderationStatus: ModerationStatus.APPROVED,
          createdAt: new Date(Date.now() - (novelData.chapters - chapterNumber) * 86400000),
        },
      })
    }

    novels.push(novel)
  }

  console.log('Seed novels:', novels.length)
  return novels
}

async function createAnnouncements() {
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Новий сезон перекладів на honni',
        description: 'Добірка ранобе про магічні академії, регресорів, богів і затишні пригоди вже в каталозі.',
        posterUrl: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1400&h=560&fit=crop',
        linkUrl: '/catalog',
        linkType: 'page',
        tag: 'featured',
        sortOrder: 1,
      },
      {
        title: 'Тайтл тижня: Хроніки місячного архіва',
        description: 'Бібліотека, що переписує майбутнє, і героїня, яка платить спогадами за кожну зміну.',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1400&h=560&fit=crop',
        linkUrl: '/novel/hroniky-misiachnoho-arhiva',
        linkType: 'novel',
        tag: 'new',
        sortOrder: 2,
      },
      {
        title: 'Команди шукають редакторів і перекладачів',
        description: 'Moon Rabbit, Foxglove і Starfall відкриті до співпраці над новими главами.',
        posterUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&h=560&fit=crop',
        linkUrl: '/forum',
        linkType: 'forum',
        tag: 'popular',
        sortOrder: 3,
      },
    ],
  })
}

async function createForum(users: Awaited<ReturnType<typeof createUsers>>, categories: any[], novels: any[]) {
  const topics = [
    {
      title: 'seed: Який тайтл із нової добірки читати першим?',
      content: 'Дивлюся на "Лицарку без мани" і "Регресора з крамницею". Хочу щось із сильним розвитком героя, але без надмірної темряви.',
      category: 'discussion',
      user: 1,
      novel: novels[2].id,
    },
    {
      title: 'seed: Moon Rabbit шукає коректора для магічного фентезі',
      content: 'Потрібна людина, яка любить академії, акуратні терміни й може вичитувати 1-2 глави на тиждень.',
      category: 'team-search',
      user: 2,
      novel: novels[0].id,
    },
    {
      title: 'seed: Пропозиція: окрема полиця для затишних ранобе',
      content: 'Було б зручно мати швидкий фільтр для спокійних історій без великої кількості боїв.',
      category: 'suggestions',
      user: 3,
    },
    {
      title: 'seed: Обговорення фіналу "Лицарки без мани"',
      content: 'Фінальна дуель вийшла неочікувано камерною. Як вам рішення авторки з епілогом?',
      category: 'discussion',
      user: 4,
      novel: novels[2].id,
    },
  ]

  const createdTopics = []
  for (const topic of topics) {
    const category = categories.find((item) => item.slug === topic.category)!
    const created = await prisma.forumTopic.create({
      data: {
        title: topic.title,
        content: topic.content,
        userId: users[topic.user].id,
        categoryId: category.id,
        novelId: topic.novel,
        moderationStatus: ModerationStatus.APPROVED,
      },
    })
    createdTopics.push(created)
  }

  await prisma.forumComment.createMany({
    data: [
      { topicId: createdTopics[0].id, userId: users[2].id, content: 'Для розвитку героя бери "Лицарку". Там дуже добре показані тренування й ціна дисципліни.' },
      { topicId: createdTopics[0].id, userId: users[5].id, content: 'А я б почав із регресора. Там легший тон і багато приємної економіки світу.' },
      { topicId: createdTopics[1].id, userId: users[4].id, content: 'Можу допомогти з тестовою вичиткою. Люблю терміни магічних систем.' },
      { topicId: createdTopics[3].id, userId: users[1].id, content: 'Епілог спокійний, але саме тому працює. Після дуелей героям потрібна тиша.' },
    ],
  })

  await prisma.forumTopicVote.createMany({
    data: [
      { topicId: createdTopics[0].id, userId: users[2].id, value: 1 },
      { topicId: createdTopics[0].id, userId: users[3].id, value: 1 },
      { topicId: createdTopics[1].id, userId: users[4].id, value: 1 },
      { topicId: createdTopics[2].id, userId: users[1].id, value: 1 },
      { topicId: createdTopics[3].id, userId: users[5].id, value: 1 },
    ],
  })
}

async function createLibraryActivity(users: Awaited<ReturnType<typeof createUsers>>, novels: any[], teams: any[]) {
  const items = [
    { user: 1, novel: 0, rating: 5, status: BookmarkStatus.reading, position: 6 },
    { user: 1, novel: 2, rating: 5, status: BookmarkStatus.completed, position: 14 },
    { user: 2, novel: 1, rating: 4, status: BookmarkStatus.reading, position: 3 },
    { user: 3, novel: 4, rating: 5, status: BookmarkStatus.planned, position: null },
    { user: 4, novel: 5, rating: 4, status: BookmarkStatus.reading, position: 7 },
    { user: 5, novel: 6, rating: 4, status: BookmarkStatus.planned, position: null },
  ]

  for (const item of items) {
    await prisma.rating.create({
      data: { userId: users[item.user].id, novelId: novels[item.novel].id, value: item.rating },
    })
    await prisma.favorite.create({
      data: { userId: users[item.user].id, novelId: novels[item.novel].id },
    })
    await prisma.bookmark.create({
      data: {
        userId: users[item.user].id,
        novelId: novels[item.novel].id,
        status: item.status,
        readingPosition: item.position,
      },
    })
  }

  await prisma.teamFollow.createMany({
    data: [
      { userId: users[1].id, teamId: teams[0].id },
      { userId: users[1].id, teamId: teams[1].id },
      { userId: users[4].id, teamId: teams[0].id },
      { userId: users[5].id, teamId: teams[2].id },
    ],
  })

  await prisma.comment.createMany({
    data: [
      { userId: users[1].id, novelId: novels[0].id, content: 'Атмосфера архіву неймовірна. Дуже подобається ціна за магію спогадів.' },
      { userId: users[2].id, novelId: novels[1].id, content: 'Фінальний бос із чайною - саме той затишний хаос, який хотілося читати ввечері.' },
      { userId: users[3].id, novelId: novels[2].id, content: 'Сильна героїня без мани написана переконливо, без легких перемог.' },
      { userId: users[4].id, novelId: novels[5].id, content: 'Регресор із крамницею має приємну економіку світу й нормальний гумор.' },
    ],
  })

  const notifications = []
  for (const novel of novels.slice(0, 4)) {
    const chapter = await prisma.chapter.findFirst({ where: { novelId: novel.id }, orderBy: { number: 'desc' } })
    if (!chapter) continue
    notifications.push({
      userId: users[1].id,
      novelId: novel.id,
      chapterId: chapter.id,
      teamId: chapter.teamId,
      type: 'NEW_CHAPTER',
      isRead: false,
    })
  }
  await prisma.notification.createMany({ data: notifications })
}

function chapterTitle(novel: SeedNovel, chapterNumber: number) {
  const titles = [
    'Перший лист із нового світу',
    'Правило, яке всі забули',
    'Нічний гість біля брами',
    'Карта без півночі',
    'Урок, що коштує спогаду',
    'Чай після дуелі',
    'Підземелля відкривається опівночі',
    'Ім’я, написане на полях',
    'Союз перед бурею',
    'Тиша після закляття',
    'Другий том: інший шлях',
    'Скарб, який не можна продати',
    'Остання сторінка сезону',
    'Епілог під ранковим небом',
  ]
  return titles[chapterNumber - 1] || `${novel.title}: розділ ${chapterNumber}`
}

function generateChapterContent(novel: SeedNovel, chapterNumber: number) {
  return `# ${chapterTitle(novel, chapterNumber)}

Перші рядки цього розділу відкривають ще один фрагмент історії **${novel.title}**. Герої вже знають, що світ не пробачає поспішних рішень, але кожен новий день приносить питання, на які немає простих відповідей.

## Сцена перша

Ранок почався з дрібниці: шурхоту паперу, віддалених кроків і світла, що падало на край столу. Саме в таких дрібницях герої помічали зміни, які інші пропускали.

> "Якщо історія повторюється, значить хтось залишив підказку між рядками".

Ця думка не давала спокою. Попереду був шлях, де доведеться обирати між безпекою і правдою.

## Сцена друга

До вечора напруга стала відчутною. Союзники говорили пошепки, карти лежали розгорнутими, а за вікном повільно згасало місто. Ніхто не хотів визнавати, що найскладніше рішення вже майже ухвалене.

- перевірити старі записи;
- знайти людину, яка бачила початок конфлікту;
- не довіряти першому очевидному поясненню;
- залишити шлях для відступу.

Фінал розділу не став відповіддю. Він став дверима, які відчиняються лише для тих, хто готовий читати далі.
`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яіїєґ0-9]+/giu, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  await cleanupSeedData()
  const users = await createUsers()
  const categories = await createForumCategories()
  const taxonomy = await createTaxonomy()
  const teams = await createTeams(users)
  const novels = await createNovels(taxonomy, teams)

  await createAnnouncements()
  await createForum(users, categories, novels)
  await createLibraryActivity(users, novels, teams)

  console.log('Seed completed')
  console.log('Admin login: admin@honni.local / admin123')
  console.log('Reader login: yuna@honni.local / reader123')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
