// TanStack Table 9: v8's createTable and get*RowModel() options are gone.
// Build with constructTable, register each feature the table uses, and put
// the create*RowModel() factories in tableFeatures slots.
import {
  columnFilteringFeature,
  constructTable,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/table-core";
import { storeReactivityBindings } from "@tanstack/table-core/store-reactivity-bindings";

export type Person = { id: number; name: string; role: string; score: number };

// Outside a framework adapter, constructTable needs reactivity bindings;
// without coreReactivityFeature it throws reading wrapExternalAtoms.
// Prerequisite features come before the slots that depend on them.
export const features = tableFeatures({
  coreReactivityFeature: storeReactivityBindings(),
  rowSortingFeature,
  columnFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { basic: sortFn_basic },
  filterFns: { equalsString: filterFn_equalsString },
});

const helper = createColumnHelper<typeof features, Person>();

export const columns = helper.columns([
  helper.accessor("name", { header: "Name" }),
  helper.accessor("role", { header: "Role", filterFn: "equalsString" }),
  helper.accessor("score", { header: "Score", sortFn: "basic" }),
]);

export function buildTable(opts: {
  data: Person[];
  sorting?: SortingState;
  filters?: ColumnFiltersState;
  pagination?: PaginationState;
}) {
  return constructTable({
    features,
    columns,
    data: opts.data,
    getRowId: (row) => String(row.id),
    initialState: {
      sorting: opts.sorting ?? [],
      columnFilters: opts.filters ?? [],
      pagination: opts.pagination ?? { pageIndex: 0, pageSize: 2 },
    },
  });
}

export function pageNames(table: ReturnType<typeof buildTable>) {
  // v9 row methods live on a shared prototype: call them on the row, never destructure.
  return table.getRowModel().rows.map((r) => r.original.name);
}
