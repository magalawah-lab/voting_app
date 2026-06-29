import { supabase } from './supabase';

const PAGE_SIZE = 1000;

type OrderBy = { column: string; ascending?: boolean };

/**
 * Fetch all rows from a Supabase table, paginating past the 1000-row API limit.
 */
export async function fetchAllRows<T>(
  table: string,
  select = '*',
  options?: {
    orderBy?: OrderBy;
  }
): Promise<{ data: T[]; error: Error | null }> {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    const { data, error } = await query;
    if (error) {
      return { data: allRows, error: new Error(error.message) };
    }

    const page = (data ?? []) as T[];
    allRows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}
