export const testTopics = {
  topic1: {
    id: 'topic-1',
    title: 'Test Topic',
    content: 'Topic content here',
    userId: 'user-regular-id',
    categoryId: 'category-1',
    novelId: null,
    moderationStatus: 'APPROVED',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-regular-id',
      name: 'Regular User',
      image: null,
    },
    category: {
      id: 'category-1',
      name: 'Discussion',
      slug: 'discussion',
      color: '#6366f1',
    },
    votes: [],
    _count: { comments: 0 },
  },
}

export const testVotes = {
  upvote: {
    id: 'vote-1',
    value: 1,
    userId: 'user-regular-id',
    topicId: 'topic-1',
    createdAt: new Date(),
  },
  downvote: {
    id: 'vote-2',
    value: -1,
    userId: 'user-author-id',
    topicId: 'topic-1',
    createdAt: new Date(),
  },
}