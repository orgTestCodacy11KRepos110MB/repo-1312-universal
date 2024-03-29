/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// eslint-disable-next-line import/no-unassigned-import
import 'zone.js';
// eslint-disable-next-line import/no-unassigned-import
import '@angular/compiler';
import { ngExpressEngine } from '@nguniversal/express-engine';

import {
  MockServerModule,
  RequestServerModule,
  ResponseServerModule,
  SOME_TOKEN,
  TokenServerModule,
} from './mock.server.module';

describe('test runner', () => {
  it('should render a basic template', (done) => {
    ngExpressEngine({ bootstrap: MockServerModule })(
      null as any as string,
      {
        req: { get: () => 'localhost' } as any,
        // TODO this shouldn't be required
        bootstrap: MockServerModule,
        document: '<root></root>',
      },
      (err, html) => {
        if (err) {
          throw err;
        }
        expect(html).toContain('some template');
        done();
      },
    );
  });

  it('Should throw when no module is passed', () => {
    ngExpressEngine({ bootstrap: null as any })(
      null as any as string,
      {
        req: {} as any,
        bootstrap: null as any,
        document: '<root></root>',
      },
      (_err, _html) => {
        expect(_err).toBeTruthy();
      },
    );
  });

  it('should be able to inject REQUEST token', (done) => {
    ngExpressEngine({ bootstrap: RequestServerModule })(
      null as any as string,
      {
        req: {
          get: () => 'localhost',
          url: 'http://localhost:4200',
        } as any,
        // TODO this shouldn't be required
        bootstrap: RequestServerModule,
        document: '<root></root>',
      },
      (err, html) => {
        if (err) {
          throw err;
        }
        expect(html).toContain('url:http://localhost:4200');
        done();
      },
    );
  });

  it('should be able to inject RESPONSE token', (done) => {
    const someStatusCode = 400;
    ngExpressEngine({ bootstrap: ResponseServerModule })(
      null as any as string,
      {
        req: {
          get: () => 'localhost',
          res: {
            statusCode: someStatusCode,
          },
        } as any,
        // TODO this shouldn't be required
        bootstrap: ResponseServerModule,
        document: '<root></root>',
      },
      (err, html) => {
        if (err) {
          throw err;
        }
        expect(html).toContain(`statusCode:${someStatusCode}`);
        done();
      },
    );
  });

  it('should be able to inject some token', (done) => {
    const someValue = { message: 'value' + new Date() };
    ngExpressEngine({
      bootstrap: TokenServerModule,
      providers: [{ provide: SOME_TOKEN, useValue: someValue }],
    })(
      null as any as string,
      {
        req: {
          get: () => 'localhost',
          url: 'http://localhost:4200',
        } as any,
        // TODO this shouldn't be required
        bootstrap: TokenServerModule,
        document: '<root></root>',
      },
      (err, html) => {
        if (err) {
          throw err;
        }
        expect(html).toContain(someValue.message);
        done();
      },
    );
  });
});
