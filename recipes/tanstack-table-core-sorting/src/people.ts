import {
  createTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/table-core";

export type Person = { id: number; name: string; role: string; score: number };

export const columns: ColumnDef<Person>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "score", header: "Score" },
];

export function buildTable(opts: {
  data: Person[];
  sorting?: SortingState;
  filters?: ColumnFiltersState;
  pagination?: PaginationState;
}) {
  return createTable({
    data: opts.data,
    columns,
    state: {
      sorting: opts.sorting ?? [],
      columnFilters: opts.filters ?? [],
      pagination: opts.pagination ?? { pageIndex: 0, pageSize: 2 },
    },
    onStateChange: () => {},
    renderFallbackValue: null,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
}

export function pageNames(table: ReturnType<typeof buildTable>) {
  return table.getRowModel().rows.map((r) => r.original.name);
}
