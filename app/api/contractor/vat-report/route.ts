import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== 'contractor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();

  const monthly = db
    .prepare(
      `
      SELECT
        strftime('%Y-%m', COALESCE(reviewed_at, submitted_at)) AS month,
        COALESCE(SUM(amount), 0) AS sales_ex_vat,
        COALESCE(SUM(vat_amount), 0) AS vat_charged,
        COALESCE(SUM(amount + vat_amount), 0) AS total_inc_vat
      FROM invoices
      WHERE status = 'approved' OR COALESCE(paid, 0) = 1
      GROUP BY month
      ORDER BY month DESC
    `
    )
    .all() as Array<{
    month: string;
    sales_ex_vat: number;
    vat_charged: number;
    total_inc_vat: number;
  }>;

  const rolling = db
    .prepare(
      `
      SELECT COALESCE(SUM(amount), 0) AS rolling_12_month_sales
      FROM invoices
      WHERE (status = 'approved' OR COALESCE(paid, 0) = 1)
        AND date(COALESCE(reviewed_at, submitted_at)) >= date('now', 'start of month', '-11 months')
        AND date(COALESCE(reviewed_at, submitted_at)) <= date('now', 'start of month', '+1 month', '-1 day')
    `
    )
    .get() as { rolling_12_month_sales: number };

  return NextResponse.json({
    months: monthly,
    rolling12MonthSalesExVat: rolling.rolling_12_month_sales || 0,
    vatThreshold: 90000,
  });
}
