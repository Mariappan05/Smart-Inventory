export interface PageOptions {
  page?: number;
  pageSize?: number;
}

export interface PageResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export abstract class BaseRepository {
  protected getPagination(options: PageOptions = {}) {
    const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 100);
    const page = Math.max(options.page ?? 1, 1);
    const skip = (page - 1) * pageSize;
    return { page, pageSize, skip, take: pageSize };
  }

  protected buildPageResult<T>(data: T[], total: number, page: number, pageSize: number): PageResult<T> {
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    return { data, total, page, pageSize, totalPages };
  }
}
