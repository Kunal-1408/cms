// File: /app/api/queries/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentPage = parseInt(searchParams.get('page') || '1');
  const queriesPerPage = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  try {
    const searchCondition: Prisma.queriesWhereInput = search
      ? {
          OR: [
            { First_Name: { contains: search, mode: 'insensitive' } },
            { Last_Name: { contains: search, mode: 'insensitive' } },
            { E_mail: { contains: search, mode: 'insensitive' } },
            { Query: { contains: search, mode: 'insensitive' } },
            { Mobile: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const queries = await prisma.queries.findMany({
      where: searchCondition,
      skip: (currentPage - 1) * queriesPerPage,
      take: queriesPerPage,
      orderBy: { id: 'desc' },
    });

    const total = await prisma.queries.count({
      where: searchCondition,
    });

    return NextResponse.json({ queries, total });
  } catch (error) {
    console.error('Error fetching queries:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Query ID is required' }, { status: 400 });
  }

  try {
    await prisma.queries.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Query deleted successfully' });
  } catch (error) {
    console.error('Error deleting query:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}