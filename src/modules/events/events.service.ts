import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../entities/event.entity';

export interface CreateEventDto {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  imageUrl?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  imageUrl?: string;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async create(dto: CreateEventDto, userId: string): Promise<Event> {
    const event = this.eventRepository.create({
      ...dto,
      createdBy: userId,
    });
    return this.eventRepository.save(event);
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ items: Event[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.eventRepository.findAndCount({
      order: { startDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, dto);
    return this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }
}
