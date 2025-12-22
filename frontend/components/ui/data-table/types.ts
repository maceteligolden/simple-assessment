import { ReactNode } from 'react'

/**
 * Base type for table data items
 * Allows any object with string keys
 */
export type TableDataItem = Record<string, unknown> | { [key: string]: unknown }

/**
 * Column alignment
 */
export type ColumnAlignment = 'left' | 'right' | 'center'

/**
 * Filter option for select filters
 */
export interface FilterOption {
  value: string
  label: string
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'boolean'
  options?: FilterOption[]
  defaultValue?: string
}

/**
 * Column definition
 */
export interface ColumnDef<T extends TableDataItem> {
  key: string
  header: string
  accessor?: (row: T) => ReactNode
  align?: ColumnAlignment
  className?: string
  headerClassName?: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Data table props
 */
export interface DataTableProps<T extends TableDataItem> {
  // Data
  data: T[]
  columns: ColumnDef<T>[]

  // Loading and empty states
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  emptyDescription?: string

  // Search
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean

  // Filters
  filters?: FilterConfig[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  showFilters?: boolean

  // Pagination
  pagination?: PaginationMeta | null
  onPageChange?: (page: number) => void
  showPagination?: boolean

  // Customization
  title?: string
  titleIcon?: ReactNode
  itemCount?: number
  className?: string
  rowClassName?: string | ((row: T) => string)
  onRowClick?: (row: T) => void

  // Actions
  actions?: ReactNode
}
