import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

interface ApiResponse {
  [key: string]: PaginatedResponse<any>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentPage = parseInt(searchParams.get('page') || '1');
  const itemsPerPage = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const dataTypes = searchParams.get('types')?.split(',') || ['websites'];

  console.log('API route hit');
  console.log('Search params:', { currentPage, itemsPerPage, search, dataTypes });

  try {
    const response: ApiResponse = {};

    for (const type of dataTypes) {
      const modelName = type;
      const model = (prisma as any)[modelName];

      if (!model) {
        console.warn(`Model ${modelName} not found in Prisma client`);
        continue;
      }

      console.log(`Fetching data for model: ${modelName}`);

      const whereClause = search
        ? {
            OR: [
              { Title: { contains: search, mode: 'insensitive' } },
              { Description: { contains: search, mode: 'insensitive' } },
              { URL: { contains: search, mode: 'insensitive' } },
              { Tags: { has: search } },
            ].filter(clause => 
              Object.keys(clause)[0] in (model.fields || {})
            ),
          }
        : {};

      try {
        console.log('Where clause:', JSON.stringify(whereClause, null, 2));

        const data = await model.findMany({
          where: whereClause,
          skip: (currentPage - 1) * itemsPerPage,
          take: itemsPerPage,
        });

        console.log(`Raw data fetched:`, JSON.stringify(data, null, 2));

        
        const sortedData = data.sort((a, b) => {
          if (a.highlighted && !b.highlighted) return -1;
          if (!a.highlighted && b.highlighted) return 1;
          return 0;
        });

        const total = await model.count({ where: whereClause });

        console.log(`Fetched ${data.length} records for ${type}`);
        console.log(`Total records: ${total}`);

        response[type] = {
          data: sortedData.map((item: any) => ({
            ...item,
            Tags: Array.isArray(item.Tags) ? item.Tags : [],
            Status: item.Status || 'Unknown',
            Images: item.Images ? (item.Images.startsWith('/uploads/') ? item.Images : `/uploads/${item.Images}`) : null,
            Logo: item.Logo ? (item.Logo.startsWith('/uploads/') ? item.Logo : `/uploads/${item.Logo}`) : null,
          })),
          total,
        };
      } catch (modelError) {
        console.error(`Error fetching data for ${type}:`, modelError instanceof Error ? modelError.message : 'Unknown error');
        if (modelError instanceof Error) {
          console.error(`Error details:`, modelError.stack);
        }
        response[type] = { data: [], total: 0 };
      }
    }

    console.log('API response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching data:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
    
    let errorMessage = 'An unexpected error occurred';
    let errorDetails: Record<string, any> = {};
    let statusCode = 500;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = 'Database error';
      errorDetails = { code: error.code, message: error.message };
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };
    }

    console.error('Detailed error:', JSON.stringify({ errorMessage, errorDetails, statusCode }, null, 2));

    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: statusCode });
  }
}

