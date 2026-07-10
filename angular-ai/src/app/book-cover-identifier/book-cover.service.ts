import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Book } from './book-cover.model';

@Service()
export class BookCoverService {

  public readonly API = '/api/books';

  private readonly http = inject(HttpClient);

  identifyCover(file: File): Observable<Book> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Book>(`${this.API}/identify-cover`, formData);
  }
}
