import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST handler for updating or creating data
export async function POST(request: Request) {
  try {
    const data = await request.json();
      const newRecord = await prisma.queries.create({
        data: {
            First_Name: data.First_Name,
            Last_Name: data.Last_Name,
            E_mail: data.E_mail,
            Query: data.Query,
            Mobile: data.Mobile
        },
      });
      return NextResponse.json(newRecord, { status: 201 }); // 201 Created
    }
   catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
