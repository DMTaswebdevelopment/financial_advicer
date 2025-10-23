import FetchingDMFiles from "./FetchingDMFiles";

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalFiles: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MDFilesPageCache {
  files: FetchingDMFiles[];
  pagination: PaginationInfo;
}
