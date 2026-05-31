import crypto from 'node:crypto'
import { ABOUT_DATA } from '../data/aboutData.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/errors.js'
import type { AboutDataDto, ContactSubmitResultDto, FaqItemDto } from '../types/content.js'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function generateTicketId(): string {
  return `CT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

export const contentService = {
  async getAbout(): Promise<AboutDataDto> {
    const block = await prisma.contentBlock.findUnique({ where: { key: 'about' } })
    if (block) return block.payload as unknown as AboutDataDto

    await prisma.contentBlock.upsert({
      where: { key: 'about' },
      update: { payload: ABOUT_DATA },
      create: { key: 'about', payload: ABOUT_DATA },
    })
    return ABOUT_DATA
  },

  async getFaq(options: { category?: string; query?: string } = {}): Promise<FaqItemDto[]> {
    const items = await prisma.faqItem.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] })

    let filtered = items

    if (options.category && options.category !== 'all') {
      filtered = filtered.filter((item) => item.category === options.category)
    }

    if (options.query?.trim()) {
      const q = options.query.trim().toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
      )
    }

    return filtered.map((item) => ({
      id: item.id,
      category: item.category,
      question: item.question,
      answer: item.answer,
    }))
  },

  async submitContact(
    payload: {
      name: string
      email: string
      subject: string
      message: string
      topic?: string
      priority?: string
    },
    full = false,
    userId?: string,
  ): Promise<ContactSubmitResultDto> {
    if (!payload.name.trim()) throw new AppError('Name is required.', 400)
    if (!payload.email.trim()) throw new AppError('Email is required.', 400)
    if (!isValidEmail(payload.email.trim())) throw new AppError('Enter a valid email address.', 400)
    if (full && !payload.topic) throw new AppError('Please select a topic.', 400)
    if (!payload.subject.trim()) throw new AppError('Subject is required.', 400)
    if (payload.message.trim().length < 10) {
      throw new AppError('Message must be at least 10 characters.', 400)
    }
    if (full && !payload.priority) throw new AppError('Please select a priority.', 400)

    const ticketId = generateTicketId()

    await prisma.contactSubmission.create({
      data: {
        ticketId,
        userId: userId ?? null,
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        subject: payload.subject.trim(),
        message: payload.message.trim(),
        topic: payload.topic ?? null,
        priority: payload.priority ?? null,
      },
    })

    return {
      ticketId,
      message: full
        ? `Message received! Your ticket ID is ${ticketId}. We will respond within 1–2 business days.`
        : 'Thanks for reaching out! We received your message and will respond within 1–2 business days.',
    }
  },
}
