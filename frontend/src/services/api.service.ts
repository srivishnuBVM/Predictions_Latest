// // src/services/api.service.ts
// import axios, { AxiosResponse } from 'axios';
// import { Observable, from, throwError } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';

// class ApiService {
//   public api_url: string = 'https://e8bc3736fe28.ngrok.app/AIP_API/api/';

//   private getJson(response: AxiosResponse<any>): any {
//     return response.data;
//   }

//   private checkForError(error: any): Observable<never> {
//     // Handle error globally
//     console.error('API Error:', error);
//     return throwError(() => error);
//   }

//   public get(path: string): Observable<any> {
//     return from(
//       axios.get(`${this.api_url}${path}`, {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       })
//     ).pipe(
//       map(this.getJson),
//       catchError(this.checkForError)
//     );
//   }
// }

// export const apiService = new ApiService();
