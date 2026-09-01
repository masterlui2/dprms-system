export interface ProjectPagination {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number | null
  to: number | null
}
