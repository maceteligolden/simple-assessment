'use client'

import { ReactNode } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTableProps, ColumnDef, TableDataItem } from './types'
import { DataTablePagination } from './DataTablePagination'

export function DataTable<T extends TableDataItem>({
  data,
  columns,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  emptyDescription,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  filters = [],
  filterValues = {},
  onFilterChange,
  showFilters = true,
  pagination,
  onPageChange,
  showPagination = true,
  title,
  titleIcon,
  itemCount,
  className = '',
  rowClassName,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const hasActiveFilters =
    filters.length > 0 &&
    Object.values(filterValues).some(value => value !== 'all' && value !== '')

  const handleClearFilters = () => {
    if (onFilterChange) {
      filters.forEach(filter => {
        onFilterChange(filter.key, filter.defaultValue || 'all')
      })
    }
  }

  const getRowClassName = (row: T): string => {
    const baseClass =
      'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
    const customClass =
      typeof rowClassName === 'function' ? rowClassName(row) : rowClassName
    return customClass ? `${baseClass} ${customClass}` : baseClass
  }

  const renderCell = (column: ColumnDef<T>, row: T): ReactNode => {
    if (column.accessor) {
      return column.accessor(row)
    }
    const value = row[column.key]
    return value !== null && value !== undefined ? String(value) : '-'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {(title || showSearch || (showFilters && filters.length > 0)) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Title */}
          {title && (
            <div className="flex items-center gap-2">
              {titleIcon && <div className="flex-shrink-0">{titleIcon}</div>}
              <h2 className="text-2xl font-semibold">{title}</h2>
              {itemCount !== undefined && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({itemCount})
                </span>
              )}
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1 sm:justify-end">
            {/* Search */}
            {showSearch && (
              <div className="flex-1 sm:flex-initial relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={e => onSearchChange?.(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {/* Filters */}
            {showFilters && filters.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {filters.map(filter => (
                  <div key={filter.key} className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                    {filter.type === 'select' && filter.options && (
                      <select
                        value={
                          filterValues[filter.key] ||
                          filter.defaultValue ||
                          'all'
                        }
                        onChange={e =>
                          onFilterChange?.(filter.key, e.target.value)
                        }
                        className="flex h-10 w-[180px] rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {filter.options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            )}

            {/* Actions */}
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      column.align === 'right'
                        ? 'text-right'
                        : column.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                    } ${column.headerClassName || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
                      {loadingText}
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div>
                      <p className="text-sm font-medium">{emptyText}</p>
                      {emptyDescription && (
                        <p className="text-xs text-gray-400 mt-1">
                          {emptyDescription}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={index}
                    className={getRowClassName(row)}
                    onClick={() => onRowClick?.(row)}
                    style={onRowClick ? { cursor: 'pointer' } : undefined}
                  >
                    {columns.map(column => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 ${
                          column.align === 'right'
                            ? 'text-right'
                            : column.align === 'center'
                              ? 'text-center'
                              : ''
                        } ${column.className || ''} ${
                          column.align !== 'right' ? 'whitespace-nowrap' : ''
                        }`}
                      >
                        {renderCell(column, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && pagination && pagination.totalPages > 1 && (
        <DataTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
